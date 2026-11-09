# pi-clipboard

Press **F3** to have Pi copy the text worth pasting from its previous response
to the system clipboard.

The copy is **agentic**, not mechanical. Responses often contain several drafts,
alternatives, or revisions; F3 sends Pi a short instruction to choose the final
or best text, merge revisions if needed, strip commentary and option labels, and
then call the `copy_to_clipboard` tool with the clean text. That way you paste
the finished version, not the whole message with its working notes.

- Registers the `copy_to_clipboard` tool.
- Registers F3, unbound by default.
- If Pi is busy, queues the request as a follow-up for the end of the turn.
- Warns when there is no assistant response yet.
- Uses Pi's own `copyToClipboard`, so native clipboard and SSH/OSC 52 behaviour
  match the built-in copy action.

## Install

Install the package from GitHub:

```sh
pi install git:github.com/bhenriq/pi-clipboard
```

Then run `/reload` in Pi (or restart it).

Keep it up to date with:

```sh
pi update git:github.com/bhenriq/pi-clipboard
# or update every installed package
pi update --extensions
```

Remove it with:

```sh
pi remove git:github.com/bhenriq/pi-clipboard
```

### Local development

Run Pi against this checkout for one session:

```sh
pi -e /path/to/pi-clipboard
```

Or symlink the checkout into Pi's extension directory. Name the symlink
`clipboard` to keep Pi's display name short:

```sh
ln -sfn /path/to/pi-clipboard ~/.pi/agent/extensions/clipboard
```

Then run `/reload` in Pi (or restart it). Do not keep the symlink and the
package install active at the same time; loading the extension twice fails on
the duplicate `copy_to_clipboard` tool.
