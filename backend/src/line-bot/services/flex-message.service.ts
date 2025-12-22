import { Injectable } from '@nestjs/common';
import { EventStatus } from '../../events/services/event-status.service';

/**
 * LINE Flex Message 類型定義
 */
export interface FlexMessage {
  type: 'flex';
  altText: string;
  contents: FlexContainer;
}

export interface FlexContainer {
  type: 'bubble' | 'carousel';
  [key: string]: unknown;
}

export interface FlexBubble extends FlexContainer {
  type: 'bubble';
  size?: 'nano' | 'micro' | 'kilo' | 'mega' | 'giga';
  header?: FlexBox;
  hero?: FlexImage;
  body?: FlexBox;
  footer?: FlexBox;
  styles?: {
    header?: FlexBlockStyle;
    hero?: FlexBlockStyle;
    body?: FlexBlockStyle;
    footer?: FlexBlockStyle;
  };
}

interface FlexBlockStyle {
  backgroundColor?: string;
  separator?: boolean;
  separatorColor?: string;
}

interface FlexBox {
  type: 'box';
  layout: 'horizontal' | 'vertical' | 'baseline';
  contents: FlexComponent[];
  spacing?: string;
  margin?: string;
  paddingAll?: string;
  paddingTop?: string;
  paddingBottom?: string;
  paddingStart?: string;
  paddingEnd?: string;
  backgroundColor?: string;
  borderWidth?: string;
  borderColor?: string;
  cornerRadius?: string;
  width?: string;
  height?: string;
  flex?: number;
  justifyContent?: string;
  alignItems?: string;
  action?: FlexAction;
}

interface FlexImage {
  type: 'image';
  url: string;
  flex?: number;
  margin?: string;
  align?: string;
  gravity?: string;
  size?: string;
  aspectRatio?: string;
  aspectMode?: string;
  backgroundColor?: string;
}

interface FlexText {
  type: 'text';
  text: string;
  flex?: number;
  margin?: string;
  size?: string;
  align?: string;
  gravity?: string;
  wrap?: boolean;
  weight?: string;
  color?: string;
  style?: string;
  decoration?: string;
  maxLines?: number;
}

interface FlexButton {
  type: 'button';
  action: FlexAction;
  flex?: number;
  margin?: string;
  height?: string;
  style?: 'primary' | 'secondary' | 'link';
  color?: string;
  gravity?: string;
}

interface FlexFiller {
  type: 'filler';
  flex?: number;
}

interface FlexSeparator {
  type: 'separator';
  margin?: string;
  color?: string;
}

interface FlexIcon {
  type: 'icon';
  url: string;
  size?: string;
  margin?: string;
  aspectRatio?: string;
}

type FlexComponent =
  | FlexBox
  | FlexImage
  | FlexText
  | FlexButton
  | FlexFiller
  | FlexSeparator
  | FlexIcon;

interface FlexAction {
  type: 'uri' | 'message' | 'postback';
  label?: string;
  uri?: string;
  text?: string;
  data?: string;
}

/**
 * 確認的時段資訊
 */
export interface ConfirmedSlotInfo {
  slotId: string;
  date: Date;
  startMinute: number;
  endMinute: number;
}

/**
 * 合併後的時間範圍
 */
export interface ConfirmedTimeRange {
  startTime: Date;
  endTime: Date;
  slotIds: string[];
}

/**
 * 事件資訊（用於建構 Flex Message）
 */
export interface EventInfo {
  id: string;
  title: string | null;
  description: string | null;
  status: EventStatus;
  votingDeadline: Date | null;
  confirmedTimeSlots: ConfirmedSlotInfo[];
  confirmedTimeRanges: ConfirmedTimeRange[];
  host: {
    displayName: string;
    pictureUrl?: string | null;
  };
  votingStats?: {
    totalExpected: number;
    totalVoted: number;
    votingPercentage: number;
  };
}

/**
 * Flex Message 建構服務
 * 負責建構 LINE Flex Messages
 */
@Injectable()
export class FlexMessageService {
  private readonly liffUrl: string;

  constructor() {
    // LIFF URL，如果沒有設置則使用 WEB_ORIGIN
    this.liffUrl = process.env.LINE_LIFF_URL || '';
  }

  /**
   * 建構活動 Flex Message
   */
  buildEventFlexMessage(event: EventInfo): FlexMessage {
    const bubble = this.buildEventBubble(event);
    return {
      type: 'flex',
      altText: `活動：${event.title || '未命名活動'}`,
      contents: bubble,
    };
  }

  /**
   * 建構活動 Bubble
   */
  private buildEventBubble(event: EventInfo): FlexBubble {
    const statusConfig = this.getStatusConfig(event.status);
    const timeInfo = this.buildTimeInfo(event);
    const actionButton = this.buildActionButton(event);

    const bodyContents: FlexComponent[] = [
      // 狀態標籤
      {
        type: 'box',
        layout: 'horizontal',
        contents: [
          {
            type: 'text',
            text: statusConfig.label,
            size: 'xs',
            color: '#ffffff',
            weight: 'bold',
            align: 'center',
          } as FlexText,
        ],
        backgroundColor: statusConfig.color,
        cornerRadius: '4px',
        paddingAll: '4px',
        width: '80px',
      } as FlexBox,
      // 標題
      {
        type: 'text',
        text: event.title || '未命名活動',
        weight: 'bold',
        size: 'xl',
        margin: 'md',
        wrap: true,
        maxLines: 2,
      } as FlexText,
    ];

    // 描述（如果有）
    if (event.description) {
      bodyContents.push({
        type: 'text',
        text: event.description,
        size: 'sm',
        color: '#666666',
        margin: 'sm',
        wrap: true,
        maxLines: 2,
      } as FlexText);
    }

    // 分隔線
    bodyContents.push({
      type: 'separator',
      margin: 'lg',
    } as FlexSeparator);

    // Host 資訊
    bodyContents.push({
      type: 'box',
      layout: 'horizontal',
      margin: 'lg',
      spacing: 'sm',
      contents: [
        ...(event.host.pictureUrl
          ? [
              {
                type: 'image',
                url: event.host.pictureUrl,
                size: '40px',
                aspectRatio: '1:1',
                aspectMode: 'cover',
              } as FlexImage,
            ]
          : []),
        {
          type: 'box',
          layout: 'vertical',
          flex: 1,
          contents: [
            {
              type: 'text',
              text: '主辦人',
              size: 'xs',
              color: '#999999',
            } as FlexText,
            {
              type: 'text',
              text: event.host.displayName,
              size: 'sm',
              weight: 'bold',
              color: '#333333',
            } as FlexText,
          ],
        } as FlexBox,
      ],
    } as FlexBox);

    // 時間資訊
    bodyContents.push({
      type: 'box',
      layout: 'horizontal',
      margin: 'lg',
      spacing: 'sm',
      contents: [
        {
          type: 'box',
          layout: 'vertical',
          flex: 1,
          contents: [
            {
              type: 'text',
              text: timeInfo.label,
              size: 'xs',
              color: '#999999',
            } as FlexText,
            {
              type: 'text',
              text: timeInfo.value,
              size: 'sm',
              color: '#333333',
              wrap: true,
            } as FlexText,
          ],
        } as FlexBox,
      ],
    } as FlexBox);

    // 投票狀態（只有 Voting 狀態才顯示）
    if (event.status === EventStatus.VOTING && event.votingStats) {
      const percentage = Math.round(event.votingStats.votingPercentage);
      bodyContents.push({
        type: 'box',
        layout: 'vertical',
        margin: 'lg',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '投票進度',
                size: 'xs',
                color: '#999999',
                flex: 1,
              } as FlexText,
              {
                type: 'text',
                text: `${event.votingStats.totalVoted}/${event.votingStats.totalExpected} (${percentage}%)`,
                size: 'xs',
                color: '#333333',
                align: 'end',
              } as FlexText,
            ],
          } as FlexBox,
          // 進度條
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                contents: [] as FlexComponent[],
                width: `${percentage}%`,
                height: '6px',
                backgroundColor: statusConfig.color,
                cornerRadius: '3px',
              } as FlexBox,
            ],
            backgroundColor: '#E0E0E0',
            cornerRadius: '3px',
            height: '6px',
          } as FlexBox,
        ],
      } as FlexBox);
    }

    return {
      type: 'bubble',
      size: 'mega',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: bodyContents,
        paddingAll: '20px',
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            height: 'sm',
            action: actionButton,
            color: statusConfig.color,
          } as FlexButton,
        ],
        paddingAll: '12px',
      },
      styles: {
        footer: {
          separator: true,
        },
      },
    };
  }

  /**
   * 取得狀態配置
   */
  private getStatusConfig(status: EventStatus): {
    label: string;
    color: string;
  } {
    switch (status) {
      case EventStatus.VOTING:
        return { label: '投票中', color: '#06C755' }; // LINE Green
      case EventStatus.VOTING_ENDED:
        return { label: '投票截止', color: '#FF9800' }; // Orange
      case EventStatus.CONFIRMED:
        return { label: '時間已定', color: '#2196F3' }; // Blue
      case EventStatus.COMPLETED:
        return { label: '已結束', color: '#9E9E9E' }; // Grey
      default:
        return { label: '未知', color: '#9E9E9E' };
    }
  }

  /**
   * 建構時間資訊
   */
  private buildTimeInfo(event: EventInfo): { label: string; value: string } {
    switch (event.status) {
      case EventStatus.VOTING:
        if (event.votingDeadline) {
          return {
            label: '投票截止時間',
            value: this.formatDateTime(event.votingDeadline),
          };
        }
        return { label: '投票截止時間', value: '未設定' };

      case EventStatus.VOTING_ENDED:
        return {
          label: '狀態',
          value: '投票已截止，等待主辦人決定活動時間',
        };

      case EventStatus.CONFIRMED:
        if (event.confirmedTimeRanges.length > 0) {
          // 使用合併後的時間範圍來顯示
          const timeStr = this.formatConfirmedTimeRanges(
            event.confirmedTimeRanges,
          );
          return {
            label: '活動時間',
            value: timeStr,
          };
        }
        return { label: '活動時間', value: '時間已確定' };

      default:
        return { label: '狀態', value: '未知' };
    }
  }

  /**
   * 建構操作按鈕
   */
  private buildActionButton(event: EventInfo): FlexAction {
    let uri: string;
    let label: string;

    switch (event.status) {
      case EventStatus.VOTING:
        uri = `${this.liffUrl}/joined/${event.id}`;
        label = '前往投票';
        break;
      case EventStatus.VOTING_ENDED:
        uri = `${this.liffUrl}/joined/${event.id}/results`;
        label = '投票結果';
        break;
      case EventStatus.CONFIRMED:
        uri = `${this.liffUrl}/joined/${event.id}`;
        label = '查看活動';
        break;
      default:
        uri = `${this.liffUrl}/joined/${event.id}`;
        label = '查看活動';
    }

    return {
      type: 'uri',
      label,
      uri,
    };
  }

  /**
   * 格式化日期時間
   */
  private formatDateTime(date: Date): string {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[d.getDay()];

    return `${month}/${day}（${weekday}）${hours}:${minutes}`;
  }

  /**
   * 格式化日期時間範圍
   */
  private formatDateTimeRange(start: Date, end: Date): string {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const month = startDate.getMonth() + 1;
    const day = startDate.getDate();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[startDate.getDay()];

    const startHours = startDate.getHours().toString().padStart(2, '0');
    const startMinutes = startDate.getMinutes().toString().padStart(2, '0');
    const endHours = endDate.getHours().toString().padStart(2, '0');
    const endMinutes = endDate.getMinutes().toString().padStart(2, '0');

    // 檢查是否跨天
    if (startDate.toDateString() === endDate.toDateString()) {
      return `${month}/${day}（${weekday}）${startHours}:${startMinutes} ~ ${endHours}:${endMinutes}`;
    } else {
      const endMonth = endDate.getMonth() + 1;
      const endDay = endDate.getDate();
      const endWeekday = weekdays[endDate.getDay()];
      return `${month}/${day}（${weekday}）${startHours}:${startMinutes} ~ ${endMonth}/${endDay}（${endWeekday}）${endHours}:${endMinutes}`;
    }
  }

  /**
   * 格式化確認的時間範圍（用於 Flex Message 顯示）
   * 如果只有一個範圍，顯示完整時間
   * 如果有多個範圍，顯示第一個 + 其他 n 個時段
   */
  private formatConfirmedTimeRanges(ranges: ConfirmedTimeRange[]): string {
    if (ranges.length === 0) {
      return '時間已確定';
    }

    const firstRange = ranges[0];
    const firstRangeStr = this.formatDateTimeRange(
      firstRange.startTime,
      firstRange.endTime,
    );

    if (ranges.length === 1) {
      return firstRangeStr;
    }

    return `${firstRangeStr}\n(+${ranges.length - 1} 個時段)`;
  }

  /**
   * 建構投票提醒訊息（使用 textV2 格式真正提及未投票使用者）
   * @see https://developers.line.biz/en/reference/messaging-api/#text-message
   */
  buildVoteReminderMessage(
    eventTitle: string,
    unvotedMembers: Array<{ lineUserId: string; displayName: string | null }>,
  ): {
    type: 'textV2';
    text: string;
    substitution: {
      [key: string]: {
        type: 'mention';
        mentionee: { type: 'user'; userId: string };
      };
    };
  } {
    // 建構 substitution 物件，用於真正的 mention
    const substitution: {
      [key: string]: {
        type: 'mention';
        mentionee: { type: 'user'; userId: string };
      };
    } = {};

    // 建構 mention placeholder 和對應的 substitution
    const mentionPlaceholders: string[] = [];
    unvotedMembers.forEach((member, index) => {
      const placeholder = `{user${index}}`;
      mentionPlaceholders.push(placeholder);
      substitution[`user${index}`] = {
        type: 'mention',
        mentionee: {
          type: 'user',
          userId: member.lineUserId,
        },
      };
    });

    // 組合 mention 文字
    const mentionsText = mentionPlaceholders.join('、');
    const text = `📢 投票提醒\n\n${mentionsText}尚未在「${eventTitle}」活動投票！\n\n趕快點擊上方按鈕參與投票吧～`;

    return {
      type: 'textV2',
      text,
      substitution,
    };
  }
}
