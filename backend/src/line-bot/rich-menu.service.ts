import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

/**
 * LINE Rich Menu 服務
 * 負責 Rich Menu 的查詢與管理
 *
 * 注意：Rich Menu 的創建與設定請使用 scripts/reset-rich-menu.ts
 */
@Injectable()
export class RichMenuService {
  private readonly logger = new Logger(RichMenuService.name);
  private readonly baseUrl = 'https://api.line.me/v2';

  /**
   * 取得目前的預設 Rich Menu ID
   */
  async getDefaultRichMenuId(): Promise<string | null> {
    try {
      const response = await axios.get<{ richMenuId: string }>(
        `${this.baseUrl}/bot/user/all/richmenu`,
        {
          headers: this.getAuthHeaders(),
        },
      );

      return response.data.richMenuId;
    } catch (error) {
      // 404 表示沒有設定預設 Rich Menu
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      this.logger.error('Failed to get default Rich Menu', error);
      return null;
    }
  }

  /**
   * 取得所有 Rich Menu 列表
   */
  async listRichMenus(): Promise<
    Array<{ richMenuId: string; name: string; chatBarText: string }>
  > {
    try {
      const response = await axios.get<{
        richmenus: Array<{
          richMenuId: string;
          name: string;
          chatBarText: string;
        }>;
      }>(`${this.baseUrl}/bot/richmenu/list`, {
        headers: this.getAuthHeaders(),
      });

      return response.data.richmenus || [];
    } catch (error) {
      this.logger.error('Failed to list Rich Menus', error);
      return [];
    }
  }

  /**
   * 刪除 Rich Menu
   */
  async deleteRichMenu(richMenuId: string): Promise<boolean> {
    try {
      await axios.delete(`${this.baseUrl}/bot/richmenu/${richMenuId}`, {
        headers: this.getAuthHeaders(),
      });

      this.logger.log(`Rich Menu deleted: ${richMenuId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete Rich Menu: ${richMenuId}`, error);
      return false;
    }
  }

  /**
   * 取消預設 Rich Menu
   */
  async cancelDefaultRichMenu(): Promise<boolean> {
    try {
      await axios.delete(`${this.baseUrl}/bot/user/all/richmenu`, {
        headers: this.getAuthHeaders(),
      });

      this.logger.log('Default Rich Menu cancelled');
      return true;
    } catch (error) {
      this.logger.error('Failed to cancel default Rich Menu', error);
      return false;
    }
  }

  /**
   * 為特定使用者連結 Rich Menu
   */
  async linkRichMenuToUser(
    userId: string,
    richMenuId: string,
  ): Promise<boolean> {
    try {
      await axios.post(
        `${this.baseUrl}/bot/user/${userId}/richmenu/${richMenuId}`,
        {},
        {
          headers: this.getAuthHeaders(),
        },
      );

      this.logger.log(`Rich Menu linked to user: ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to link Rich Menu to user: ${userId}`, error);
      return false;
    }
  }

  /**
   * 取消特定使用者的 Rich Menu
   */
  async unlinkRichMenuFromUser(userId: string): Promise<boolean> {
    try {
      await axios.delete(`${this.baseUrl}/bot/user/${userId}/richmenu`, {
        headers: this.getAuthHeaders(),
      });

      this.logger.log(`Rich Menu unlinked from user: ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to unlink Rich Menu from user: ${userId}`,
        error,
      );
      return false;
    }
  }

  private getAuthHeaders() {
    return {
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    };
  }
}
