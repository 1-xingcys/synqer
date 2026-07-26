/**
 * Rich Menu reset script
 *
 * Usage:
 *   npx ts-node scripts/reset-rich-menu.ts
 *
 * Or through the npm script:
 *   npm run reset-rich-menu
 *
 * Note: LINE_CHANNEL_ACCESS_TOKEN and LINE_LIFF_URL must be set
 */

import * as dotenv from 'dotenv';
import axios from 'axios';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
const { createCanvas } = require('canvas');

// Load environment variables
dotenv.config();

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LINE_LIFF_URL = process.env.LINE_LIFF_URL || '';
const BASE_URL = 'https://api.line.me/v2';

if (!LINE_CHANNEL_ACCESS_TOKEN) {
  console.error('❌ 錯誤：請設定 LINE_CHANNEL_ACCESS_TOKEN 環境變數');
  process.exit(1);
}

const authHeaders = {
  Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
};

/**
 * Generate the rich menu image
 */
function generateRichMenuImage(): Buffer {
  const width = 2500;
  const height = 843;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const canvas = createCanvas(width, height);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const ctx = canvas.getContext('2d');

  // 1. Main background gradient
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  bgGradient.addColorStop(0, '#9B8FD9'); // light purple (top-left of the logo)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  bgGradient.addColorStop(0.5, '#7A9BE0'); // blue-purple (middle of the logo)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  bgGradient.addColorStop(1, '#5DC4E0'); // light cyan (bottom-right of the logo)

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  ctx.fillStyle = bgGradient;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  ctx.fillRect(0, 0, width, height);

  // 2. Background decoration (circles and arcs)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  ctx.globalAlpha = 0.1;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  ctx.fillStyle = '#FFFFFF';
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  ctx.beginPath();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  ctx.arc(width * 0.1, height * 0.2, 300, 0, Math.PI * 2);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  ctx.fill();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  ctx.beginPath();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  ctx.arc(width * 0.9, height * 0.8, 500, 0, Math.PI * 2);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  ctx.fill();

  // Large arc echoing the S in the logo
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  ctx.strokeStyle = '#FFFFFF';
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  ctx.lineWidth = 150;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  ctx.beginPath();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  ctx.arc(width / 2, height / 2, 600, 0, Math.PI, true);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  ctx.stroke();

  // 3. Blurred divider down the middle
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  ctx.globalAlpha = 0.2;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  ctx.fillStyle = '#000000';
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  ctx.fillRect(1248, 0, 4, height);

  // 4. Button drawing helper
  const drawButton = (
    x: number,
    y: number,
    w: number,
    h: number,
    title: string,
    subtitle: string,
    iconType: 'plus' | 'list',
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ctx.globalAlpha = 1.0;
    const centerX = x + w / 2;

    // Button background container (frosted glass look)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    const padding = 60;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    ctx.beginPath();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    ctx.roundRect(
      x + padding,
      y + padding,
      w - padding * 2,
      h - padding * 2,
      40,
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    ctx.fill();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ctx.lineWidth = 4;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    ctx.stroke();

    // Icon
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ctx.fillStyle = '#FFFFFF';
    if (iconType === 'plus') {
      // Plus icon
      const iconY = 320;
      const size = 100;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      ctx.beginPath();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      ctx.arc(centerX, iconY, size, 0, Math.PI * 2);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      ctx.fill();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      ctx.strokeStyle = bgGradient;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ctx.lineWidth = 20;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      ctx.beginPath();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      ctx.moveTo(centerX - 40, iconY);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      ctx.lineTo(centerX + 40, iconY);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      ctx.moveTo(centerX, iconY - 40);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      ctx.lineTo(centerX, iconY + 40);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      ctx.stroke();
    } else {
      // List icon
      const iconY = 320;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ctx.strokeStyle = '#FFFFFF';
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ctx.lineWidth = 15;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const lineY = iconY - 40 + i * 40;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        ctx.moveTo(centerX - 60, lineY);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        ctx.lineTo(centerX + 60, lineY);
        // Bullet dots
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        ctx.arc(centerX - 85, lineY, 8, 0, Math.PI * 2);
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      ctx.stroke();
    }

    // Text
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ctx.textAlign = 'center';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ctx.fillStyle = '#FFFFFF';

    // Title
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ctx.font = 'bold 84px "PingFang TC", "Microsoft JhengHei", sans-serif';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    ctx.fillText(title, centerX, 520);

    // Subtitle
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ctx.font = '42px "PingFang TC", "Microsoft JhengHei", sans-serif';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ctx.globalAlpha = 0.8;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    ctx.fillText(subtitle, centerX, 600);
  };

  // 5. Left and right buttons
  drawButton(
    0,
    0,
    1250,
    height,
    '發起新活動',
    '快速建立投票並邀請朋友',
    'plus',
  );
  drawButton(1250, 0, 1250, height, '查看活動', '管理您的所有活動', 'list');

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  return canvas.toBuffer('image/png');
}

/**
 * List every rich menu
 */
async function listRichMenus(): Promise<
  Array<{ richMenuId: string; name: string }>
> {
  try {
    const response = await axios.get<{
      richmenus: Array<{ richMenuId: string; name: string }>;
    }>(`${BASE_URL}/bot/richmenu/list`, {
      headers: authHeaders,
    });
    return response.data.richmenus || [];
  } catch {
    return [];
  }
}

/**
 * Delete a rich menu
 */
async function deleteRichMenu(richMenuId: string): Promise<boolean> {
  try {
    await axios.delete(`${BASE_URL}/bot/richmenu/${richMenuId}`, {
      headers: authHeaders,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Unset the default rich menu
 */
async function cancelDefaultRichMenu(): Promise<boolean> {
  try {
    await axios.delete(`${BASE_URL}/bot/user/all/richmenu`, {
      headers: authHeaders,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Create the rich menu
 */
async function createRichMenu(): Promise<string | null> {
  const richMenuObject = {
    size: {
      width: 2500,
      height: 843,
    },
    selected: true,
    name: 'Synqer Main Menu',
    chatBarText: '開啟選單',
    areas: [
      {
        bounds: { x: 0, y: 0, width: 1250, height: 843 },
        action: {
          type: 'uri',
          uri: `${LINE_LIFF_URL}/new`,
          label: '發起新活動',
        },
      },
      {
        bounds: { x: 1250, y: 0, width: 1250, height: 843 },
        action: {
          type: 'uri',
          uri: `${LINE_LIFF_URL}/events/voting`,
          label: '查看發起的活動',
        },
      },
    ],
  };

  try {
    const response = await axios.post<{ richMenuId: string }>(
      `${BASE_URL}/bot/richmenu`,
      richMenuObject,
      {
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data.richMenuId;
  } catch (error) {
    console.error('❌ 創建 Rich Menu 失敗:', error);
    return null;
  }
}

/**
 * Upload the rich menu image
 */
async function uploadRichMenuImage(richMenuId: string): Promise<boolean> {
  try {
    const imageBuffer = generateRichMenuImage();

    await axios.post(
      `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`,
      imageBuffer,
      {
        headers: {
          ...authHeaders,
          'Content-Type': 'image/png',
        },
      },
    );
    return true;
  } catch (error) {
    console.error('❌ 上傳 Rich Menu 圖片失敗:', error);
    return false;
  }
}

/**
 * Set the default rich menu
 */
async function setDefaultRichMenu(richMenuId: string): Promise<boolean> {
  try {
    await axios.post(
      `${BASE_URL}/bot/user/all/richmenu/${richMenuId}`,
      {},
      {
        headers: authHeaders,
      },
    );
    return true;
  } catch (error) {
    console.error('❌ 設定預設 Rich Menu 失敗:', error);
    return false;
  }
}

/**
 * Entry point
 */
async function main() {
  console.log('🔄 開始重設 Rich Menu...\n');

  // 1. Unset the default rich menu
  console.log('📌 步驟 1/5: 取消預設 Rich Menu');
  await cancelDefaultRichMenu();
  console.log('   ✅ 完成\n');

  // 2. Delete every old rich menu
  console.log('📌 步驟 2/5: 刪除所有舊的 Rich Menu');
  const existingMenus = await listRichMenus();
  if (existingMenus.length > 0) {
    for (const menu of existingMenus) {
      console.log(`   🗑️  刪除: ${menu.name} (${menu.richMenuId})`);
      await deleteRichMenu(menu.richMenuId);
    }
  } else {
    console.log('   ℹ️  沒有舊的 Rich Menu');
  }
  console.log('   ✅ 完成\n');

  // 3. Create the new rich menu
  console.log('📌 步驟 3/5: 創建新的 Rich Menu');
  const richMenuId = await createRichMenu();
  if (!richMenuId) {
    console.error('❌ 創建 Rich Menu 失敗，終止腳本');
    process.exit(1);
  }
  console.log(`   ✅ 完成: ${richMenuId}\n`);

  // 4. Upload the rich menu image
  console.log('📌 步驟 4/5: 上傳 Rich Menu 圖片');
  const imageUploaded = await uploadRichMenuImage(richMenuId);
  if (!imageUploaded) {
    console.error('❌ 上傳圖片失敗，刪除已創建的 Rich Menu');
    await deleteRichMenu(richMenuId);
    process.exit(1);
  }
  console.log('   ✅ 完成\n');

  // 5. Make it the default rich menu
  console.log('📌 步驟 5/5: 設定為預設 Rich Menu');
  const setDefault = await setDefaultRichMenu(richMenuId);
  if (!setDefault) {
    console.error('❌ 設定預設失敗');
    process.exit(1);
  }
  console.log('   ✅ 完成\n');

  console.log('🎉 Rich Menu 重設成功！');
  console.log(`   📋 Rich Menu ID: ${richMenuId}`);
  console.log(`   🔗 LIFF URL: ${LINE_LIFF_URL}`);
}

main().catch((error) => {
  console.error('❌ 執行失敗:', error);
  process.exit(1);
});
