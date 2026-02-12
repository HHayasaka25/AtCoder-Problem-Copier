// ==UserScript==
// @name         AtCoderProblemCopier
// @namespace    https://github.com/HHayasaka25/AtCoder-Problem-Copier
// @version      0.0.2
// @description Add buttons to copy AtCoder problem statements in Markdown format
// @author       LIama
// @license      MIT
// @homepage     https://github.com/HHayasaka25/AtCoder-Problem-Copier
// @supportURL   https://github.com/HHayasaka25/AtCoder-Problem-Copier/issues
// @match        https://atcoder.jp/contests/*/tasks/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
	'use strict';

	let cachedTaskData = null;

	function main() {
		cachedTaskData = getTask();
		initButtons();
		watchLanguageSwitch();
	}


	function initButtons() {
		console.log('[APC] ボタンの設置を開始');

		// 既存のボタンを削除（重複防止）
		document.querySelectorAll('.ext-copy-group').forEach(el => el.remove());

		// データの取得
		const data = cachedTaskData || getTask();

		// ボタンを作成する関数
		const createButtonGroup = () => {
			const group = document.createElement("span");
			group.className = "ext-copy-group";
			group.style.marginLeft = "10px";

			group.appendChild(makeButton("コピー", "ja", data, data.ja.length > 0));
			group.appendChild(makeButton("Copy", "en", data, data.en.length > 0));

			return group;
		};

		// 指定されたコンテナ内で、特定のテキストを含むh3を探すヘルパー関数
		const findHeader = (root, candidates) => {
			if (!root) return null;
			const headers = Array.from(root.querySelectorAll("h3"));
			for (const text of candidates) {
				const found = headers.find(h => h.textContent.includes(text));
				if (found) return found;
			}
			return null;
		};

		// 各エリアの取得
		const jaNode = document.querySelector(".lang-ja");
		const enNode = document.querySelector(".lang-en");
		const taskStatement = document.querySelector("#task-statement");

		// --- ボタン配置ロジック ---

		if (jaNode || enNode) {
			// Case 1: 言語タグがある場合
			if (jaNode) {
				// 日本語エリア: "問題文" を優先検索、なければ最初のh3
				const target = findHeader(jaNode, ["問題文"]) || jaNode.querySelector("h3");
				if (target) target.appendChild(createButtonGroup());
			}
			if (enNode) {
				// 英語エリア: "Problem Statement" を優先検索、なければ最初のh3
				const target = findHeader(enNode, ["Problem Statement"]) || enNode.querySelector("h3");
				if (target) target.appendChild(createButtonGroup());
			}
		} else if (taskStatement) {
			// Case 2: 言語タグがない場合
			// "問題文" > "Problem Statement" > 最初のh3 の順で優先して探す
			let target = findHeader(taskStatement, ["問題文"]);
			if (!target) target = findHeader(taskStatement, ["Problem Statement"]);
			if (!target) target = taskStatement.querySelector("h3");

			if (target) {
				console.log("[APC] 言語タグなし。ターゲットヘッダー:", target.textContent.trim());
				target.appendChild(createButtonGroup());
			} else {
				console.log("[APC] ボタン配置先のヘッダーが見つかりませんでした。");
			}
		}
		console.log("[APC] ボタン配置完了。");
	}

	// 言語切り替えボタンのクリックを監視
	function watchLanguageSwitch() {
		console.log('[APC] watchLanguageSwitch() 開始');

		const langBtn = document.querySelector('#task-lang-btn');
		console.log('[APC] 言語切り替えボタン:', langBtn);

		if (!langBtn) {
			console.log('[APC] 言語切り替えボタンが見つかりません');
			return;
		}

		// 言語切り替えボタンのクリックを監視
		langBtn.addEventListener('click', function (e) {
			console.log('[APC] 言語切り替えボタンがクリックされました', e.target);

			// 少し遅延させてからボタンを追加（DOMの更新を待つ）
			setTimeout(() => {
				console.log('[APC] 50ms後、ボタンを再追加');
				initButtons();
			}, 50);
		});

		console.log('[APC] 言語切り替えボタンの監視を開始しました');
	}

	// ボタンを生成する
	function makeButton(label, lang, data, isValid) {
		const btn = document.createElement("span");
		btn.className = "btn btn-default btn-sm btn-copy ml-1";
		btn.innerText = label;

		if (!isValid) {
			// ボタンが無効 -> グレーアウト
			btn.style.opacity = "0.4";
			btn.style.cursor = "not-allowed";
			btn.setAttribute("title", "No Text Found");
		} else {
			// ボタンが有効
			btn.setAttribute("tabindex", "0");
			btn.setAttribute("data-toggle", "tooltip");
			btn.setAttribute("data-trigger", "manual");
			btn.setAttribute("title", "Copied!");
			btn.style.cursor = "pointer";

			// クリックイベント
			btn.onclick = async (e) => {
				e.preventDefault();
				e.stopPropagation();

				// 対応するデータを選択
				const contentParts = (lang === "ja") ? data.ja : data.en;
				const text = [data.limit, ...contentParts].join("\n\n");

				try {
					await navigator.clipboard.writeText(text);
					btn.blur();
					// ツールチップ表示（jQuery依存）
					if (typeof $ !== 'undefined' && $.fn.tooltip) {
						$(btn).tooltip('show');
						setTimeout(() => $(btn).tooltip('hide'), 1000);
					}
				} catch (err) {
					console.error("[APC] コピー失敗:", err);
					alert("コピーに失敗しました");
				}
			}
		};

		return btn;
	}

	// ソースから該当部分を取り出す
	// 実行時間制限・メモリ制限
	function getLimit() {
		const target = document.querySelector("#main-container");
		if (!target) return "";
		const lines = target.innerText.split("\n");
		for (const line of lines) {
			if (line.startsWith("実行時間制限")) {
				return line.trim();
			}
		}
		return "";
	}

	// 問題文部分の取り出し
	function getTask() {
		const limit = getLimit();
		const container = document.querySelector("#task-statement");

		if (!container) return { limit: limit, ja: [], en: [] };

		// 言語タグの確認
		const langJaNode = container.querySelector("span.lang-ja");
		const langEnNode = container.querySelector("span.lang-en");
		console.log("日本語ノードを出力");
		console.log(langJaNode);

		// Case 1: 言語タグが存在する場合（通常）
		if (langJaNode || langEnNode) {
			console.log('[APC] 言語タグを検出しました。日英分離モードで取得します。');
			return {
				limit: limit,
				ja: langJaNode ? extractPartsFromNode(langJaNode) : [],
				en: langEnNode ? extractPartsFromNode(langEnNode) : []
			};
		}

		// 言語タグが見つからなかった場合はすべて日本語として扱う
		console.log('[APC] 言語タグが見つかりませんでした。全データをJPとして取得します。');

		return {
			limit: limit,
			ja: extractPartsFromNode(container), // 全てJPへ
			en: []                               // ENは空（ボタンは無効化される）
		};
	}

	function extractPartsFromNode(rootNode) {
		const elements = rootNode.querySelectorAll(".part");
		const parts = [];
		elements.forEach(element => {
			const htmlText = element.innerHTML;
			let markdown = convertToMarkdown(htmlText);
			markdown = markdown.trim(); // 前後の空白・改行を除去

			// 空でない場合のみ追加（空行だけのブロック対策）
			if (markdown !== "") {
				parts.push(markdown);
			}
		});
		return parts;
	}

	// この関数はchatGPTに助けを請うた（諦め）
	function convertToMarkdown(htmlText) {
		const parser = new DOMParser();
		const doc = parser.parseFromString(htmlText, "text/html");

		function walk(node) {
			if (node.nodeType === Node.TEXT_NODE) {
				let text = node.textContent;
				text = text.replace(/\s+/g, " ");
				return text;
			}

			if (node.nodeType !== Node.ELEMENT_NODE) return "";

			// 除外対象のクラスや属性をチェック
			if (
				// Copyボタンは無視
				node.classList.contains("ext-copy-group") ||
				node.classList.contains("div-btn-copy") ||
				node.classList.contains("btn-copy") ||
				node.classList.contains("btn") ||
				node.getAttribute("data-toggle") === "tooltip" ||
				// 数式展開後の余計な要素は無視
				node.classList.contains("katex-html")
			) {
				return "";
			}

			// 数式の処理
			if (node.classList.contains("katex-mathml")) {
				const anno = node.querySelector('annotation[encoding="application/x-tex"]');
				if (!anno) return "";
				const latex = anno.textContent.trim();
				// ディスプレイ数式（ブロック数式）の判定
				// 親要素にkatex-displayがある、またはmathタグにdisplay="block"がある場合
				const isDisplay = node.closest(".katex-display") || node.querySelector('math[display="block"]');
				return isDisplay ? `\n$$\n${latex}\n$$\n` : `$${latex}$`;
			}

			const tag = node.tagName;

			// コードブロック内の数式は特殊
			if (tag === "PRE") {
				const formulas = node.querySelectorAll(".katex-mathml");
				if (formulas.length > 0) {
					const lines = [];
					formulas.forEach(katex => {
						const anno = katex.querySelector('annotation[encoding="application/x-tex"]');
						if (anno) lines.push(`$$${anno.textContent.trim()}$$`);
					});
					return `\`\`\`\n${lines.join("\n")}\n\`\`\`\n\n`;
				}
				return `\`\`\`\n${node.textContent.trim()}\n\`\`\`\n\n`;
			}

			// 空白のみの場合に無視するタグ
			let isBlockContainer = false;
			switch (tag) {
				case "BODY":
				case "SECTION":
				case "DIV":
				case "ARTICLE":
				case "MAIN":
				case "ASIDE":
				case "HEADER":
				case "FOOTER":
				case "UL":
				case "OL":
				case "DL":
				case "BLOCKQUOTE":
					isBlockContainer = true;
					break;
			}

			let children = "";
			node.childNodes.forEach(child => {
				// コンテナ直下の空白のみのテキストノードは、レイアウト用の改行/インデントとみなして無視する
				if (isBlockContainer && child.nodeType === Node.TEXT_NODE && child.textContent.trim() === "") {
					return;
				}
				children += walk(child);
			});

			switch (tag) {
				case "H1": return `# ${children.trim()}\n\n`;
				case "H2": return `## ${children.trim()}\n\n`;
				case "H3": return `### ${children.trim()}\n\n`;
				case "P": return `${children.trim()}\n\n`;
				case "LI": return `- ${children.trim()}\n`;
				case "BR": return "\n";
				case "VAR":
					const t = children.trim();
					if (!t) return "";
					return t.startsWith("$") ? t : `$${t}$`;
				default: return children;
			}
		}

		return walk(doc.body).trim();
	}

	main();
})();
