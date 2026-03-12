export interface Room {
  id: string;
  name: string | null;
  createdAt: string;
  lastActive: string;
  files: RoomFile[];
}

export interface RoomFile {
  id: string;
  roomId: string;
  name: string;
  language: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  username: string;
  content: string;
  createdAt: string;
}

export interface UserSession {
  username: string;
  clientId: string;
  color: string;
}

export interface RoomUser {
  username: string;
  color: string;
  clientId: string;
}
