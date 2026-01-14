"use client";
import { useState, useEffect, useCallback } from "react";
import type { Post } from "@/app/_types/Post";
import type { PostApiResponse } from "@/app/_types/PostApiResponse";
import Link from "next/link";
import AdminPostSummary from "@/app/_components/AdminPostSummary";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";

const Page: React.FC = () => {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const requestUrl = `/api/posts`;
      const response = await fetch(requestUrl, {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("データの取得に失敗しました");
      }
      const postResponse: PostApiResponse[] = await response.json();
      setPosts(
        postResponse.map((rawPost) => ({
          id: rawPost.id,
          title: rawPost.title,
          content: rawPost.content,
          coverImage: {
            url: rawPost.coverImageURL,
            width: 1000,
            height: 1000,
          },
          createdAt: rawPost.createdAt,
          categories: rawPost.categories.map((category) => ({
            id: category.category.id,
            name: category.category.name,
          })),
        })),
      );
    } catch (e) {
      setFetchError(
        e instanceof Error ? e.message : "予期せぬエラーが発生しました",
      );
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const reloadAction = async () => {
    await fetchPosts();
  };

  if (fetchError) {
    return <div>{fetchError}</div>;
  }

  if (!posts) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <main>
      <div className="text-2xl font-bold">投稿記事の管理</div>

      <div className="mb-3 flex items-end justify-end">
        <Link href="/admin/posts/new">
          <button
            type="submit"
            className={twMerge(
              "rounded-md px-5 py-1 font-bold",
              "bg-blue-500 text-white hover:bg-blue-600",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            新規作成
          </button>
        </Link>
      </div>

      <div className="space-y-3">
        {posts.map((post) => (
          <AdminPostSummary
            key={post.id}
            post={post}
            reloadAction={reloadAction}
            setIsSubmitting={setIsSubmitting}
          />
        ))}
      </div>

      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex items-center rounded-lg bg-white px-8 py-4 shadow-lg">
            <FontAwesomeIcon
              icon={faSpinner}
              className="mr-2 animate-spin text-gray-500"
            />
            <div className="flex items-center text-gray-500">処理中...</div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Page;
