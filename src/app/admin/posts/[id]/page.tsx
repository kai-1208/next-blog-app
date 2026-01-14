"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// カテゴリをフェッチしたときのレスポンスのデータ型
type RawApiCategoryResponse = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

// 投稿記事をフェッチしたときのレスポンスのデータ型
type PostApiResponse = {
  id: string;
  title: string;
  content: string;
  coverImageURL: string;
  createdAt: string;
  categories: {
    category: {
      id: string;
      name: string;
    };
  }[];
};

// 投稿記事のカテゴリ選択用のデータ型
type SelectableCategory = {
  id: string;
  name: string;
  isSelect: boolean;
};

// Zodスキーマの定義
const postSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(100, "タイトルは100文字以内で入力してください"),
  content: z
    .string()
    .min(1, "本文は必須です")
    .max(5000, "本文は5000文字以内で入力してください"),
  coverImageURL: z.string().url("正しいURLを入力してください"),
  categoryIds: z.array(z.string()),
});

type PostFormData = z.infer<typeof postSchema>;

// 投稿記事の編集ページ
const Page: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchErrorMsg, setFetchErrorMsg] = useState<string | null>(null);

  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [checkableCategories, setCheckableCategories] = useState<
    SelectableCategory[] | null
  >(null);

  const [rawApiPostResponse, setRawApiPostResponse] =
    useState<PostApiResponse | null>(null);

  // react-hook-formの設定
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      content: "",
      coverImageURL: "",
      categoryIds: [],
    },
  });

  const watchedCategoryIds = watch("categoryIds");

  // 投稿記事の取得
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const requestUrl = `/api/posts/${id}`;
        const res = await fetch(requestUrl, {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) {
          setRawApiPostResponse(null);
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        const apiResBody = (await res.json()) as PostApiResponse;
        setRawApiPostResponse(apiResBody);
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? `投稿記事の取得に失敗しました: ${error.message}`
            : `予期せぬエラーが発生しました ${error}`;
        console.error(errorMsg);
        setFetchErrorMsg(errorMsg);
      }
    };

    fetchPost();
  }, [id]);

  // カテゴリの一覧の取得
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const requestUrl = "/api/categories";
        const res = await fetch(requestUrl, {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) {
          setCheckableCategories(null);
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        const apiResBody = (await res.json()) as RawApiCategoryResponse[];
        setCheckableCategories(
          apiResBody.map((body) => ({
            id: body.id,
            name: body.name,
            isSelect: false,
          })),
        );
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? `カテゴリの一覧のフェッチに失敗しました: ${error.message}`
            : `予期せぬエラーが発生しました ${error}`;
        console.error(errorMsg);
        setFetchErrorMsg(errorMsg);
      }
    };
    fetchCategories();
  }, []);

  // 投稿記事のデータが取得できたらカテゴリの選択状態を更新する
  useEffect(() => {
    if (isInitialized) return;
    if (!rawApiPostResponse || !checkableCategories) return;

    // フォームの値を設定
    setValue("title", rawApiPostResponse.title);
    setValue("content", rawApiPostResponse.content);
    setValue("coverImageURL", rawApiPostResponse.coverImageURL);

    const selectedIds = rawApiPostResponse.categories.map((c) => c.category.id);
    setValue("categoryIds", selectedIds);

    // カテゴリの選択状態を更新
    const selectedIdsSet = new Set(selectedIds);
    setCheckableCategories(
      checkableCategories.map((category) => ({
        ...category,
        isSelect: selectedIdsSet.has(category.id),
      })),
    );
    setIsInitialized(true);
  }, [isInitialized, rawApiPostResponse, checkableCategories, setValue]);

  // チェックボックスの状態を更新する関数
  const switchCategoryState = (categoryId: string) => {
    if (!checkableCategories) return;

    const currentIds = watchedCategoryIds || [];
    const newIds = currentIds.includes(categoryId)
      ? currentIds.filter((id) => id !== categoryId)
      : [...currentIds, categoryId];

    setValue("categoryIds", newIds);

    setCheckableCategories(
      checkableCategories.map((category) =>
        category.id === categoryId
          ? { ...category, isSelect: !category.isSelect }
          : category,
      ),
    );
  };

  // フォームの送信処理
  const onSubmit = async (data: PostFormData) => {
    setIsSubmitting(true);

    try {
      const requestUrl = `/api/admin/posts/${id}`;
      console.log(`${requestUrl} => ${JSON.stringify(data, null, 2)}`);
      const res = await fetch(requestUrl, {
        method: "PUT",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      setIsSubmitting(false);
      router.push("/");
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `投稿記事のPUTリクエストに失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
      setIsSubmitting(false);
    }
  };

  if (fetchErrorMsg) {
    return <div className="text-red-500">{fetchErrorMsg}</div>;
  }

  if (!isInitialized) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <main>
      <div className="mb-4 text-2xl font-bold">投稿記事の編集・削除</div>

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

      <form
        onSubmit={handleSubmit(onSubmit)}
        className={twMerge("space-y-4", isSubmitting && "opacity-50")}
      >
        <div className="space-y-1">
          <label htmlFor="title" className="block font-bold">
            タイトル
          </label>
          <input
            type="text"
            id="title"
            className="w-full rounded-md border-2 px-2 py-1"
            placeholder="タイトルを記入してください"
            {...register("title")}
          />
          {errors.title && (
            <p className="text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="content" className="block font-bold">
            本文
          </label>
          <textarea
            id="content"
            className="h-48 w-full rounded-md border-2 px-2 py-1"
            placeholder="本文を記入してください"
            {...register("content")}
          />
          {errors.content && (
            <p className="text-sm text-red-500">{errors.content.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="coverImageURL" className="block font-bold">
            カバーイメージ (URL)
          </label>
          <input
            type="url"
            id="coverImageURL"
            className="w-full rounded-md border-2 px-2 py-1"
            placeholder="カバーイメージのURLを記入してください"
            {...register("coverImageURL")}
          />
          {errors.coverImageURL && (
            <p className="text-sm text-red-500">
              {errors.coverImageURL.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <div className="font-bold">タグ</div>
          <div className="flex flex-wrap gap-x-3.5">
            {checkableCategories!.length > 0 ? (
              checkableCategories!.map((c) => (
                <label key={c.id} className="flex space-x-1">
                  <input
                    id={c.id}
                    type="checkbox"
                    checked={c.isSelect}
                    className="mt-0.5 cursor-pointer"
                    onChange={() => switchCategoryState(c.id)}
                  />
                  <span className="cursor-pointer">{c.name}</span>
                </label>
              ))
            ) : (
              <div>選択可能なカテゴリが存在しません。</div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="submit"
            className={twMerge(
              "rounded-md px-5 py-1 font-bold",
              "bg-indigo-500 text-white hover:bg-indigo-600",
              "disabled:cursor-not-allowed",
            )}
            disabled={isSubmitting}
          >
            記事を更新
          </button>

          <button
            type="button"
            className={twMerge(
              "rounded-md px-5 py-1 font-bold",
              "bg-red-500 text-white hover:bg-red-600",
            )}
          >
            削除
          </button>
        </div>
      </form>
    </main>
  );
};

export default Page;
