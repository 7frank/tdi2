// src/services/ExampleApiInterface.ts

export interface ExampleApiInterface {
  getData(): Promise<string[]>;
  postData(data: any): Promise<boolean>;
  getUserInfo(id: string): Promise<{ id: string; name: string; email: string }>;
}

export const EXAMPLE_API_TOKEN = 'ExampleApiInterface';