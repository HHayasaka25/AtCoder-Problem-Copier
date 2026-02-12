// ==UserScript==
// @name         AtCoderProblemCopier
// @name:en      AtCoderProblemCopier
// @name:zh-CN   AtCoderProblemCopier
// @name:zh-TW   AtCoderProblemCopier
// @namespace    https://github.com/HHayasaka25/AtCoder-Problem-Copier
// @version      0.0.2
// @description  AtCoderの問題文の横に、Markdown形式で問題文をコピーするボタンを追加します。
// @description:en Add buttons to copy AtCoder problem statements in Markdown format
// @description:zh-CN 在AtCoder题目页面添加Markdown格式的复制按钮
// @description:zh-TW 在AtCoder題目頁面添加Markdown格式的複製按鈕
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

		// データの取得
		const data = cachedTaskData || getTask();

		// ボタン挿入先の候補
		const jaHeader = document.querySelector(".lang-ja h3");
		const enHeader = document.querySelector(".lang-en h3");

		// タグがない場合は最初の見出し3に追加
		const firstHeader = document.querySelector("#task-statement h3");

		// ボタンを作成する関数
		const createButtonGroup = () => {
			const group = document.createElement("span");
			group.className = "ext-copy-group";
			group.style.marginLeft = "10px";

			group.appendChild(makeButton("JP", "ja", data, data.ja.length > 0));
			group.appendChild(makeButton("EN", "en", data, data.en.length > 0));

			return group;
		};

		// ボタンを配置
		// JPまたはENタグがある場合
		if (jaHeader || enHeader) {
			if (jaHeader) jaHeader.appendChild(createButtonGroup());
			if (enHeader) enHeader.appendChild(createButtonGroup());
		}

		// 言語タグがない場合
		else if (firstHeader) {
			console.log("[APC] 言語タグが見つかりませんでした。最初の見出しにボタンを配置します。");
			firstHeader.appendChild(createButtonGroup());
		}

		console.log("[APC] ボタン配置完了。")
	}

	// 言語切り替えボタンのクリックを監視
	function watchLanguageSwitch() {
		console.log('[AtCoder Copy] watchLanguageSwitch() 開始');

		const langBtn = document.querySelector('#task-lang-btn');
		console.log('[AtCoder Copy] 言語切り替えボタン:', langBtn);

		if (!langBtn) {
			console.log('[AtCoder Copy] 言語切り替えボタンが見つかりません');
			return;
		}

		// 言語切り替えボタンのクリックを監視
		langBtn.addEventListener('click', function (e) {
			console.log('[AtCoder Copy] 言語切り替えボタンがクリックされました', e.target);

			// 少し遅延させてからボタンを追加（DOMの更新を待つ）
			setTimeout(() => {
				console.log('[AtCoder Copy] 50ms後、ボタンを再追加');
				initButtons();
			}, 50);
		});

		console.log('[AtCoder Copy] 言語切り替えボタンの監視を開始しました');
	}

	// ボタンを生成する
	function makeButton(label, lang, data, isValid) {
		const btn = document.createElement("span");
		btn.className = "btn btn-default btn-sm btn-copy ml-1";
		btn.innerText = label;

		if(!isValid){
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
		const lines = target.innerText.split("\n")
		// console.log(lines);
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

		// Case 1: 言語タグが存在する場合（通常）
		if (langJaNode || langEnNode) {
			console.log('[AtCoder Copy] 言語タグを検出しました。日英分離モードで取得します。');
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

			if (
				node.classList.contains("ext-copy-group") ||
				node.classList.contains("div-btn-copy") ||
				node.classList.contains("katex-html")
			) {
				return "";
			}

			if (node.classList.contains("katex-mathml")) {
				const anno = node.querySelector('annotation[encoding="application/x-tex"]');
				return anno ? `$${anno.textContent.trim()}$` : "";
			}

			const tag = node.tagName;

			if (tag === "PRE") {
				const formulas = node.querySelectorAll(".katex-mathml");
				if (formulas.length > 0) {
					const lines = [];
					formulas.forEach(katex => {
						const anno = katex.querySelector('annotation[encoding="application/x-tex"]');
						if (anno) lines.push(`$$${anno.textContent.trim()}$$`);
					});
					return `\n\`\`\`\n${lines.join("\n")}\n\`\`\`\n\n`;
				}
				return `\n\`\`\`\n${node.textContent.replace(/^\n+|\n+$/g, "")}\n\`\`\`\n\n`;
			}

			let children = "";
			node.childNodes.forEach(child => {
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
