/**
 * pi-clipboard
 *
 * Press F3 to have Pi choose the text worth pasting from its previous response
 * and put it on the system clipboard. The copy is agentic: responses often
 * contain several drafts or alternative versions, so the model decides what the
 * final text is instead of blindly copying the whole message.
 */

import { Type } from "@earendil-works/pi-ai";
import {
	copyToClipboard,
	defineTool,
	type ExtensionAPI,
	type ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Key } from "@earendil-works/pi-tui";

const COPY_PROMPT = `Copy to my clipboard the text from your immediately preceding response that I should paste elsewhere.

That response may contain several drafts, alternatives, revisions, or commentary about the text. Do not copy it mechanically. Work out which text is the final or best version, merge revisions if that is clearly the intent, and include the complete text rather than a fragment.

Strip anything that is not meant to be pasted: meta-commentary, option labels such as "Version 2", explanations about the changes, and code fences unless the fences are part of the content itself. Preserve the intended formatting and language.

Then call the copy_to_clipboard tool exactly once with the clean text. Do not ask me to choose unless the candidates are genuinely unrelated; in that case copy the most complete one. If there is no suitable text, say so without calling the tool.`;

const copyTool = defineTool({
	name: "copy_to_clipboard",
	label: "Copy to clipboard",
	description:
		"Put exact text on the user's system clipboard so they can paste it into another application. " +
		"Pass only the text to be pasted, already cleaned of commentary, option labels, and other wrappers. " +
		"Use this when the user asks for something to be copied.",
	parameters: Type.Object({
		text: Type.String({
			description:
				"The exact text to place on the clipboard. Do not add commentary or a preamble.",
		}),
	}),

	async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
		const text = params.text;
		if (!text.trim()) {
			return {
				content: [
					{
						type: "text",
						text: "Nothing copied: the text is empty.",
					},
				],
				details: { copied: false, chars: 0 },
				isError: true,
			};
		}

		await copyToClipboard(text);
		ctx.ui.notify(
			`Copied to clipboard (${text.length.toLocaleString()} chars)`,
			"info",
		);

		return {
			content: [
				{
					type: "text",
					text: `Copied ${text.length.toLocaleString()} characters to the clipboard.`,
				},
			],
			details: { copied: true, chars: text.length },
		};
	},
});

function hasAssistantResponse(ctx: ExtensionContext): boolean {
	const entries = ctx.sessionManager.getEntries();
	for (let i = entries.length - 1; i >= 0; i--) {
		const entry = entries[i];
		if (entry.type !== "message" || entry.message.role !== "assistant") {
			continue;
		}
		const content = entry.message.content;
		if (typeof content === "string") return content.trim().length > 0;
		if (
			Array.isArray(content) &&
			content.some(
				(part) => part?.type === "text" && part.text?.trim(),
			)
		) {
			return true;
		}
	}
	return false;
}

export default function (pi: ExtensionAPI) {
	pi.registerTool(copyTool);

	pi.registerShortcut(Key.f3, {
		description: "Ask Pi to copy the right text from its last response",
		handler: (ctx) => {
			if (!hasAssistantResponse(ctx)) {
				ctx.ui.notify(
					"Nothing to copy: no assistant response yet",
					"warning",
				);
				return;
			}

			if (ctx.isIdle()) {
				ctx.ui.notify("Choosing text to copy…", "info");
				pi.sendUserMessage(COPY_PROMPT);
			} else {
				pi.sendUserMessage(COPY_PROMPT, { deliverAs: "followUp" });
				ctx.ui.notify(
					"Will choose and copy text when the current turn finishes",
					"info",
				);
			}
		},
	});
}
