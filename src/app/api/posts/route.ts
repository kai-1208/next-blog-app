import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import type { Post } from "@/generated/prisma/client";

type RequestBody = {
  title: string;
  content: string;
  coverImageURL: string;
  categoryIds: string[];
};

export const GET = async (req: NextRequest) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(posts, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "投稿記事の取得に失敗しました" },
      { status: 500 },
    );
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const requestBody: RequestBody = await req.json();

    // 分割代入
    const { title, content, coverImageURL, categoryIds } = requestBody;

    // categoryIds で指定されるカテゴリがDB上に存在するか確認
    const categories = await prisma.category.findMany({
      where: {
        id: {
          in: categoryIds,
        },
      },
    });
    if (categories.length !== categoryIds.length) {
      return NextResponse.json(
        { error: "指定されたカテゴリのいくつかが存在しません" },
        { status: 400 }, // 400: Bad Request
      );
    }

    // 投稿記事テーブルにレコードを追加
    const post: Post = await prisma.post.create({
      data: {
        title, // title: title の省略形であることに注意。以下も同様
        content,
        coverImageURL,
      },
    });

    // 中間テーブルにレコードを追加
    for (const categoryId of categoryIds) {
      await prisma.postCategory.create({
        data: {
          postId: post.id,
          categoryId: categoryId,
        },
      });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "投稿記事の作成に失敗しました" },
      { status: 500 },
    );
  }
};
