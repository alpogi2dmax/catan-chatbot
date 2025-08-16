export function formatConvHistory(messages) {
    return messages
        .map((msg, i) => (i % 2 === 0 ? `Human: ${msg}`: `AI: ${msg}`))
        .join('\n')
}