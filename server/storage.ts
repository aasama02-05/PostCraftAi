import { db } from "./db";
import { posts, type Post, type InsertPost } from "@shared/schema";
import { desc } from "drizzle-orm";

export interface IStorage {
  getPosts(): Promise<Post[]>;
  createPost(post: InsertPost): Promise<Post>;
}

export class DatabaseStorage implements IStorage {
  async getPosts(): Promise<Post[]> {
    return await db.select().from(posts).orderBy(desc(posts.createdAt));
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values(insertPost)
      .returning();
    return post;
  }
}

export const storage = new DatabaseStorage();
