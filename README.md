# AtCoder Problem Statement → Markdown Converter

# 概要
AtCoder の問題文ページをMarkdown に変換してコピーするボタンを追加します。AIへの質問をしやすくする用途を想定しています。

## 機能

### ✅ 数式を正しく Markdown 化

- KaTeX で描画されている数式を LaTeX として抽出
- 見た目用の HTML は無視し、**意味（LaTeX）のみを保持**
- 数式の重複・欠落が起きない
