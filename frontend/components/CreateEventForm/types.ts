export interface CreateEventFormData {
  title: string;
  description: string;
  startDate: Date | null;
  endDate: Date | null;
  startTime: string;
  endTime: string;
  slotDurationMin: number;
  timeZone: string;
}

export const initialFormData: CreateEventFormData = {
  title: "",
  description: "",
  startDate: null,
  endDate: null,
  startTime: "00:00",
  endTime: "23:59",
  slotDurationMin: 15,
  timeZone: "Asia/Taipei",
};
