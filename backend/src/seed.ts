import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { BoardsService } from './boards/boards.service';
import { TasksService } from './tasks/tasks.service';
import { TaskStatus } from './tasks/task.schema';
import * as bcrypt from 'bcrypt';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const usersService = app.get(UsersService);
  const boardsService = app.get(BoardsService);
  const tasksService = app.get(TasksService);

  console.log('Seeding database...');

  // Create demo user
  let user = await usersService.findByEmail('demo@example.com');
  if (!user) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    user = await usersService.create({
      name: 'Demo User',
      email: 'demo@example.com',
      password: hashedPassword,
    });
    console.log('Demo user created: demo@example.com / password123');
  } else {
    console.log('Demo user already exists');
  }

  const userId = user._id!.toString();

  // Create a sample board
  const boards = await boardsService.findAllByUser(userId);
  let board;
  if (boards.length === 0) {
    board = await boardsService.create(
      {
        title: 'My First Board',
        description: 'A sample board with demo tasks',
      },
      userId,
    );
    console.log('Sample board created');

    // Create sample tasks
    await tasksService.create(
      {
        title: 'Research project requirements',
        description: 'Gather and document all project requirements',
        status: TaskStatus.TODO,
      },
      board._id.toString(),
    );

    await tasksService.create(
      {
        title: 'Design database schema',
        description: 'Create the MongoDB schema design',
        status: TaskStatus.IN_PROGRESS,
      },
      board._id.toString(),
    );

    await tasksService.create(
      {
        title: 'Setup project boilerplate',
        description: 'Initialize NestJS project with required dependencies',
        status: TaskStatus.DONE,
      },
      board._id.toString(),
    );

    console.log('Sample tasks created');
  } else {
    console.log('Sample board already exists');
  }

  console.log('Seeding complete!');
  await app.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
