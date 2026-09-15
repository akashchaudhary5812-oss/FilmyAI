export interface ApiResponse<T = unknown> {
  status?: boolean;
  message?: string;
  data?: T;
}

export interface ApiErrorResponse {
  message?: string;
  error?: string;
  statusCode?: number;
}
