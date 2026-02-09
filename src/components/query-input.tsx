"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EXAMPLE_QUESTIONS = [
  "도시별 고객 수는?",
  "월별 매출 추이 보여줘",
  "30달러 미만 상품 목록",
  "주문 상태별 비율은?",
  "가장 많이 팔린 상품 TOP 5",
];

interface QueryInputProps {
  onSubmit: (question: string) => void;
  isLoading: boolean;
}

export function QueryInput({ onSubmit, isLoading }: QueryInputProps) {
  const [question, setQuestion] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !isLoading) {
      onSubmit(question.trim());
    }
  };

  const handleExample = (example: string) => {
    setQuestion(example);
    onSubmit(example);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="데이터에 대해 질문해보세요..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading || !question.trim()}>
          {isLoading ? "분석 중..." : "질문하기"}
        </Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {EXAMPLE_QUESTIONS.map((example) => (
          <Button
            key={example}
            variant="outline"
            size="sm"
            onClick={() => handleExample(example)}
            disabled={isLoading}
          >
            {example}
          </Button>
        ))}
      </div>
    </div>
  );
}
