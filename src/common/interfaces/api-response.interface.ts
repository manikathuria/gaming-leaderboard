export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data?: T;
  message?: string | object;
  timestamp: string;
}
