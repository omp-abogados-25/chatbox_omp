export class Message {
    constructor(
      public readonly id: string,
      public readonly from: string,
      public readonly body: string,
      public readonly phoneNumberId: string,
    ) {
      if (!id || !from) throw new Error('Invalid message data');
    }
  }
  