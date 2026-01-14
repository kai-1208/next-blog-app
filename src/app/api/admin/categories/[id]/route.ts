import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { Category } from "@/generated/prisma/client";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// ▼▼▼ 追加: ここから ▼▼▼
type RequestBody = {
  name: string;
};

export const PUT = async (req: NextRequest, routeParams: RouteParams) => {
  try {
    const { id } = await routeParams.params;
    const { name }: RequestBody = await req.json();
    const category: Category = await prisma.category.update({
      where: { id },
      data: { name },
    });
    return NextResponse.json(category);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "カテゴリの名前変更に失敗しました" },
      { status: 500 },
    );
  }
};
// ▲▲▲ 追加: ここまで ▲▲▲

export const DELETE = async (req: NextRequest, routeParams: RouteParams) => {
  try {
    const { id } = await routeParams.params;
    const category: Category = await prisma.category.delete({ where: { id } });
    return NextResponse.json({ msg: `「${category.name}」を削除しました。` });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "カテゴリの削除に失敗しました" },
      { status: 500 },
    );
  }
};
