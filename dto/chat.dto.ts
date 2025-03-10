export interface MessageDto {
  message: string;
  direction: string;
  sender: string;
  token?: number;
}

export interface NewChaDto {
  userid: string;
  chat_type: string;
  messages: MessageDto[];
  chatName?: string;
  file_id?: string
}

export interface UpdateChaDto {
  _id: string;
  messages?: MessageDto[];
  userid?: string;
  chat_type?: string;
  chatName?: string;
}
