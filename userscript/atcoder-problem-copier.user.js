// ==UserScript==
// @name         AtCoderProblemCopier
// @namespace    https://github.com/HHayasaka25/AtCoder-Problem-Copier
// @version      1.0.0
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

	function main() {
		initButtons();
		watchLanguageSwitch();
	}


	function initButtons() {
		console.log('[AtCoder Copy] initButtons() 開始');

		// 日本語と英語の両方の最初のh3にボタンを追加
		const jaHeader = document.querySelector(".lang-ja h3");
		const enHeader = document.querySelector(".lang-en h3");

		console.log('[AtCoder Copy] 日本語ヘッダー:', jaHeader);
		console.log('[AtCoder Copy] 英語ヘッダー:', enHeader);

		if (jaHeader && !jaHeader.querySelector(".ext-copy-group")) {
			console.log('[AtCoder Copy] 日本語ヘッダーにボタンを追加');
			const group = document.createElement("span");
			group.className = "ext-copy-group";
			group.style.marginLeft = "10px";

			group.appendChild(makeButtons("コピー", "ja"));
			group.appendChild(makeButtons("Copy", "en"));

			jaHeader.appendChild(group);
		} else {
			console.log('[AtCoder Copy] 日本語ヘッダーにはボタンが既に存在、またはヘッダーが見つからない');
		}

		if (enHeader && !enHeader.querySelector(".ext-copy-group")) {
			console.log('[AtCoder Copy] 英語ヘッダーにボタンを追加');
			const group = document.createElement("span");
			group.className = "ext-copy-group";
			group.style.marginLeft = "10px";

			group.appendChild(makeButtons("コピー", "ja"));
			group.appendChild(makeButtons("Copy", "en"));

			enHeader.appendChild(group);
		} else {
			console.log('[AtCoder Copy] 英語ヘッダーにはボタンが既に存在、またはヘッダーが見つからない');
		}

		console.log('[AtCoder Copy] initButtons() 完了');
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
	function makeButtons(label, lang) {
		const btn = document.createElement("span");

		// クラスを完全に一致させる
		btn.className = "btn btn-default btn-sm btn-copy ml-1";

		// 属性の設定（元のボタンと同じ構成）
		btn.setAttribute("tabindex", "0");
		btn.setAttribute("data-toggle", "tooltip");
		btn.setAttribute("data-trigger", "manual");
		btn.setAttribute("title", "");
		btn.setAttribute("data-original-title", "Copied!");

		btn.innerText = label;

		// クリックイベント
		btn.onclick = async (e) => {
			e.preventDefault();
			e.stopPropagation();

			console.log(`[AtCoder Copy] ${label}ボタンがクリックされました (lang: ${lang})`);

			const data = getTask();
			const text = (lang === "ja")
				? [data.limit, ...data.ja].join("\n\n")
				: [data.limit, ...data.en].join("\n\n");

			if (lang === "en" && data.en.length === 0) {
				console.log('[AtCoder Copy] 英語版が存在しません');
				return alert("No English");
			}

			try {
				await navigator.clipboard.writeText(text);
				console.log('[AtCoder Copy] クリップボードへのコピー成功');

				btn.blur();

				// 元のボタンと同じ挙動：ボタンの色は変えず、tooltipのみ表示
				if (typeof $ !== 'undefined' && $.fn.tooltip) {
					// tooltipを表示
					$(btn).tooltip('show');

					// 約1秒後に非表示
					setTimeout(() => {
						$(btn).tooltip('hide');
					}, 1000);
				}
			} catch (err) {
				console.error("[AtCoder Copy] コピー失敗:", err);
				alert("コピーに失敗しました");
			}
		};

		return btn;
	}

	// ソースから該当部分を取り出す
	// 実行時間制限・メモリ制限
	function getLimit() {
		const target = document.querySelector("#main-container");
		const lines = target.innerText.split("\n")
		for (const line of lines) {
			if (line.startsWith("実行時間制限")) {
				return line;
			}
		}
	}

	// 問題文部分の取り出し
	function getTask() {
		const limit = getLimit();

		const container = document.querySelector("#task-statement")
		if (!container) return { limit: limit, ja: [], en: [] };

		const elements = container.querySelectorAll(".part");
		const allParts = [];

		// HTML から Markdown に変換
		elements.forEach(element => {
			const htmlText = element.innerHTML;
			const markdown = convertToMarkdown(htmlText);
			allParts.push(markdown);
		})

		// 日本語の問題文と英語の問題文を分割
		const splitIndex = allParts.findIndex(text => text.includes("Problem Statement"));
		let japaneseParts = [];
		let englishParts = [];

		if (splitIndex === -1) {
			japaneseParts = allParts;
		} else {
			japaneseParts = allParts.slice(0, splitIndex);
			englishParts = allParts.slice(splitIndex);
		}

		return {
			limit: limit,
			ja: japaneseParts,
			en: englishParts
		}
	}

	// この関数はchatGPTに助けを請うた（諦め）
	function convertToMarkdown(htmlText) {
		const parser = new DOMParser();
		const doc = parser.parseFromString(htmlText, "text/html");

		function walk(node, inPre = false) {
			// --- TEXT ---
			if (node.nodeType === Node.TEXT_NODE) {
				if (inPre) return "";
				let text = node.textContent;
				text = text.replace(/\s+/g, " ");
				text = text.replace(/([^\x01-\x7E]) ([^\x01-\x7E])/g, "$1$2");
				return text;
			}

			if (node.nodeType !== Node.ELEMENT_NODE) return "";

			// --- 無視 ---
			if (
				node.classList.contains("ext-copy-group") ||
				node.classList.contains("div-btn-copy") ||
				node.classList.contains("katex-html")
			) {
				return "";
			}

			// --- KaTeX 数式本体 ---
			if (node.classList.contains("katex-mathml")) {
				const anno = node.querySelector(
					'annotation[encoding="application/x-tex"]'
				);
				if (!anno) return "";
				const latex = anno.textContent.trim();
				return inPre ? `$$${latex}$$` : `$${latex}$`;
			}

			const tag = node.tagName;

			// --- PRE ---
			if (tag === "PRE") {
				const formulas = node.querySelectorAll(".katex-mathml");

				// 1. 数式が含まれている PRE
				if (formulas.length > 0) {
					const lines = [];
					formulas.forEach(katex => {
						const anno = katex.querySelector(
							'annotation[encoding="application/x-tex"]'
						);
						if (anno) {
							lines.push(`$$${anno.textContent.trim()}$$`);
						}
					});
					return `\n\`\`\`\n${lines.join("\n")}\n\`\`\`\n\n`;
				}

				// 2. 純テキスト PRE（入力例・出力例）
				const text = node.textContent
					.replace(/\n+$/, "")   // 末尾の改行整理
					.replace(/^\n+/, "");  // 先頭の改行整理

				return `\n\`\`\`\n${text}\n\`\`\`\n\n`;
			}

			// --- 再帰 ---
			let children = "";
			node.childNodes.forEach(child => {
				children += walk(child, inPre);
			});

			// --- Markdown ---
			switch (tag) {
				case "H1":
					return `# ${children.trim()}\n\n`;
				case "H2":
					return `## ${children.trim()}\n\n`;
				case "H3":
					return `### ${children.trim()}\n\n`;
				case "P":
					return `${children.trim()}\n\n`;
				case "LI":
					return `- ${children.trim()}\n`;
				case "BR":
					return "\n";
				case "VAR":
					if (inPre) return "";
					const t = children.trim();
					if (!t) return "";
					return t.startsWith("$") ? t : `$${t}$`;
				default:
					return children;
			}
		}

		return walk(doc.body).trim();
	}

	main();
})();
