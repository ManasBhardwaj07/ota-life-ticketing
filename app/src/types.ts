export interface Event {
  id: number;
  name: string;
  venue: string;
  date: string;
  price: string | number;
  ticketsLeft: number;
}

export interface Ticket {
  code: string;
  createdAt: string;
  checkedInAt: string | null;
  event: {
    id: number;
    name: string;
    venue: string;
    date: string;
  };
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    checkedInAt?: string;
  };
}
