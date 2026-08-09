import TurndownService from 'turndown';

const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
    strongDelimiter: '**',
    preformattedCode: true,
});

turndownService.addRule('keepDataElements', {
    filter: ['pre', 'code'],
    replacement: (content: string, node: HTMLElement) => {
        const isBlock = node.tagName === 'PRE' || node.parentNode?.nodeName === 'LI';
        if (isBlock) {
            return `\n\`\`\`\n${content.trim()}\n\`\`\`\n`;
        }
        return `\`${content.trim()}\``;
    },
});

turndownService.addRule('removeEmptyLinks', {
    filter: (node: HTMLElement) => {
        return (
            node.nodeName === 'A' &&
            (!node.textContent || node.textContent.trim() === '') &&
            !node.querySelector('img')
        );
    },
    replacement: () => '',
});

export function htmlToMarkdown(html: string): string {
    const markdown = turndownService.turndown(html);
    return markdown
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
