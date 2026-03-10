import React from 'react'

/**
 * RichText component to parse and highlight @mentions and URLs.
 */
function RichText({ text, className = "" }) {
    if (!text) return null

    // Regex to find @mentions and URLs
    // Mentions: @[Name] or @[Name Surname]
    // URLs: standard web links
    const mentionRegex = /@\[([^\]]+)\]|@(\w+)/g
    const urlRegex = /(https?:\/\/[^\s]+)/g

    // Split text by mentions and URLs to process them
    const parts = text.split(/(@\[[^\]]+\]|@\w+|https?:\/\/[^\s]+)/g)

    return (
        <span className={className}>
            {parts.map((part, i) => {
                if (!part) return null

                // Handle @[Name] or @Name
                const mentionMatch = part.match(/^@\[([^\]]+)\]|^@(\w+)/)
                if (mentionMatch) {
                    const name = mentionMatch[1] || mentionMatch[2]
                    return (
                        <span
                            key={i}
                            className="text-blue-400 font-black cursor-pointer hover:underline decoration-blue-500/30"
                            onClick={(e) => {
                                e.stopPropagation()
                                // Future: show user profile tooltip
                            }}
                        >
                            @{name}
                        </span>
                    )
                }

                // Handle URLs
                if (part.match(/^https?:\/\//)) {
                    return (
                        <a
                            key={i}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 font-semibold hover:underline"
                            onClick={e => e.stopPropagation()}
                        >
                            {part.length > 30 ? part.substring(0, 27) + "..." : part}
                        </a>
                    )
                }

                return <React.Fragment key={i}>{part}</React.Fragment>
            })}
        </span>
    )
}

export default RichText
