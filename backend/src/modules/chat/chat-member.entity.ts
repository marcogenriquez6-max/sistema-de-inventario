import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('chat_room_members')
export class ChatRoomMember {
  @PrimaryColumn({ name: 'room_id' })
  roomId: number;

  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  @Column({ name: 'joined_at', type: 'timestamptz' })
  joinedAt: Date;

  @Index()
  @Column({ name: 'last_read_at', type: 'timestamptz' })
  lastReadAt: Date;
}
