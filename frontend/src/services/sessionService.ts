import api from './api';
import { SessionListResponse, RevokeResponse } from '../types/session';

export const getSessions = async (): Promise<SessionListResponse> => {
  const response = await api.get<SessionListResponse>('/sessions');
  return response.data;
};

export const revokeSession = async (id: string): Promise<RevokeResponse> => {
  const response = await api.post<RevokeResponse>(`/sessions/${id}/revoke`);
  return response.data;
};

export const revokeAllSessions = async (): Promise<RevokeResponse> => {
  const response = await api.post<RevokeResponse>('/sessions/revoke-all');
  return response.data;
};

export const sessionService = {
  getSessions,
  revokeSession,
  revokeAllSessions,
};

export default sessionService;
