import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly userService: UserService,
  ) {}

  async sendMessage(senderId: string, receiverId: string, content: string) {
    const message = this.messageRepository.create({
      sender: { id: senderId },
      receiver: { id: receiverId },
      content,
    });

    return this.messageRepository.save(message);
  }

  async getChatHistory(user1Id: string, user2Id: string) {
    return this.messageRepository.find({
      where: [
        { sender: { id: user1Id }, receiver: { id: user2Id } },
        { sender: { id: user2Id }, receiver: { id: user1Id } },
      ],
      order: { createdAt: 'ASC' },
    });
  }
}
