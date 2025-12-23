"use client";

import {
  useState,
  useCallback,
  createContext,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import type { LiffState } from "@/lib/liff";

// ========== 設定 ==========
// 設為 true 啟用 Debug Console，設為 false 關閉
export const DEBUG_ENABLED = false;

// ========== 全域日誌存儲 ==========
export interface DebugLog {
  time: string;
  prefix: string;
  message: string;
  data?: unknown;
}

// 全域日誌陣列
let globalLogs: DebugLog[] = [];
// 訂閱者列表
const subscribers: Set<(logs: DebugLog[]) => void> = new Set();

// 通知所有訂閱者
function notifySubscribers() {
  subscribers.forEach((callback) => callback([...globalLogs]));
}

// 全域 addLog 函數
export function debugLog(prefix: string, message: string, data?: unknown) {
  if (!DEBUG_ENABLED) return;

  const time = new Date().toLocaleTimeString();
  const log: DebugLog = { time, prefix, message, data };
  globalLogs = [...globalLogs, log];
  console.log(`[${prefix} ${time}]`, message, data ?? "");
  notifySubscribers();
}

// 清除全域日誌
export function clearDebugLogs() {
  globalLogs = [];
  notifySubscribers();
}

// 訂閱日誌更新
function subscribeToLogs(callback: (logs: DebugLog[]) => void) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

// ========== 類型定義 ==========
interface DebugContextType {
  logs: DebugLog[];
  liffState: LiffState | null;
  setLiffState: (state: LiffState | null) => void;
  extraInfo: Record<string, string | boolean | null | undefined>;
  setExtraInfo: (
    info: Record<string, string | boolean | null | undefined>,
  ) => void;
}

// ========== Context ==========
const DebugContext = createContext<DebugContextType | null>(null);

export function useDebug() {
  const context = useContext(DebugContext);

  // 如果 DEBUG_ENABLED 為 false，返回空操作
  if (!DEBUG_ENABLED) {
    return {
      logs: [],
      liffState: null,
      setLiffState: () => {},
      extraInfo: {},
      setExtraInfo: () => {},
    };
  }

  if (!context) {
    throw new Error("useDebug must be used within a DebugProvider");
  }

  return context;
}

// ========== Provider ==========
interface DebugProviderProps {
  children: ReactNode;
  title?: string;
}

export function DebugProvider({
  children,
  title = "Debug",
}: DebugProviderProps) {
  // 使用函數初始化來獲取最新的 globalLogs
  const [logs, setLogs] = useState<DebugLog[]>(() => [...globalLogs]);
  const [liffState, setLiffState] = useState<LiffState | null>(null);
  const [extraInfo, setExtraInfo] = useState<
    Record<string, string | boolean | null | undefined>
  >({});
  const [showPanel, setShowPanel] = useState(false);

  // 訂閱全域日誌更新
  useEffect(() => {
    if (!DEBUG_ENABLED) return undefined;

    const unsubscribe = subscribeToLogs(setLogs);
    return () => {
      unsubscribe();
    };
  }, []);

  // 如果 DEBUG_ENABLED 為 false，只渲染 children
  if (!DEBUG_ENABLED) {
    return <>{children}</>;
  }

  return (
    <DebugContext.Provider
      value={{
        logs,
        liffState,
        setLiffState,
        extraInfo,
        setExtraInfo,
      }}
    >
      {children}
      {showPanel && (
        <DebugPanel
          title={title}
          logs={logs}
          liffState={liffState}
          extraInfo={extraInfo}
          onHide={() => setShowPanel(false)}
          onClear={clearDebugLogs}
        />
      )}
      {!showPanel && (
        <button
          onClick={() => setShowPanel(true)}
          className="fixed bottom-4 right-4 z-50 px-3 py-2 bg-zinc-800 text-white text-xs rounded-lg shadow-lg"
        >
          🔧 Show Debug
        </button>
      )}
    </DebugContext.Provider>
  );
}

// ========== Panel Component ==========
interface DebugPanelProps {
  title: string;
  logs: DebugLog[];
  liffState: LiffState | null;
  extraInfo: Record<string, string | boolean | null | undefined>;
  onHide: () => void;
  onClear: () => void;
}

function DebugPanel({
  title,
  logs,
  liffState,
  extraInfo,
  onHide,
  onClear,
}: DebugPanelProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 text-white text-xs max-h-[50vh] overflow-auto">
      <div className="flex items-center justify-between p-2 bg-zinc-800 sticky top-0">
        <span className="font-bold">🔧 {title}</span>
        <div className="flex gap-2">
          <button onClick={onClear} className="px-2 py-1 bg-zinc-600 rounded">
            Clear
          </button>
          <button onClick={onHide} className="px-2 py-1 bg-red-600 rounded">
            Hide
          </button>
        </div>
      </div>
      <div className="p-2 space-y-2">
        {/* Extra Info */}
        {Object.keys(extraInfo).length > 0 && (
          <div className="grid grid-cols-2 gap-2 p-2 bg-zinc-800 rounded">
            {Object.entries(extraInfo).map(([key, value]) => {
              let displayValue: string;
              if (value === null || value === undefined) {
                displayValue = "null";
              } else {
                displayValue = String(value);
              }
              return (
                <div key={key}>
                  <span className="text-zinc-400">{key}:</span>{" "}
                  <span
                    className={
                      value === true ||
                      value === "authenticated" ||
                      value === "Yes"
                        ? "text-green-400"
                        : value === false || value === "null" || value === "No"
                          ? "text-red-400"
                          : "text-zinc-300"
                    }
                  >
                    {displayValue}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* LIFF State */}
        {liffState && (
          <div className="p-2 bg-zinc-800 rounded">
            <div className="font-bold mb-1">LIFF State:</div>
            <div className="grid grid-cols-2 gap-1">
              <div>
                isInitialized:{" "}
                <span
                  className={
                    liffState.isInitialized ? "text-green-400" : "text-red-400"
                  }
                >
                  {String(liffState.isInitialized)}
                </span>
              </div>
              <div>
                isInClient:{" "}
                <span
                  className={
                    liffState.isInClient ? "text-green-400" : "text-yellow-400"
                  }
                >
                  {String(liffState.isInClient)}
                </span>
              </div>
              <div>
                isLoggedIn:{" "}
                <span
                  className={
                    liffState.isLoggedIn ? "text-green-400" : "text-red-400"
                  }
                >
                  {String(liffState.isLoggedIn)}
                </span>
              </div>
              {liffState.error && (
                <div className="col-span-2 text-red-400">
                  Error: {liffState.error.message}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Logs */}
        <div className="p-2 bg-zinc-800 rounded">
          <div className="font-bold mb-1">Logs ({logs.length}):</div>
          {logs.length === 0 ? (
            <div className="text-zinc-500">No logs yet</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="py-0.5 border-b border-zinc-700">
                <span className="text-zinc-500">[{log.time}]</span>{" "}
                <span className="text-blue-400">[{log.prefix}]</span>{" "}
                {log.message}
                {log.data !== undefined && (
                  <pre className="text-zinc-400 ml-4 text-[10px]">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ========== Standalone Hook (不需要 Provider) ==========
export function useDebugLogs(prefix: string = "Debug") {
  const addLog = useCallback(
    (message: string, data?: unknown) => {
      debugLog(prefix, message, data);
    },
    [prefix],
  );

  return { addLog, clearLogs: clearDebugLogs };
}
