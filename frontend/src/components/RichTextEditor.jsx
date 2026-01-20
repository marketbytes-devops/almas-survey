import React, { useState, useRef } from 'react';

const RichTextEditor = ({ value, onChange, placeholder, rows = 6 }) => {
    const textareaRef = useRef(null);

    const insertTag = (openTag, closeTag = '') => {
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);
        const before = value.substring(0, start);
        const after = value.substring(end);

        const newValue = before + openTag + selectedText + closeTag + after;
        onChange({ target: { value: newValue } });

        // Set cursor position after insertion
        setTimeout(() => {
            const newCursorPos = start + openTag.length + selectedText.length;
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const insertLineBreak = () => {
        insertTag('<br/>');
    };

    const makeBold = () => {
        insertTag('<strong>', '</strong>');
    };

    const makeItalic = () => {
        insertTag('<em>', '</em>');
    };

    const insertBulletList = () => {
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);

        if (selectedText) {
            const lines = selectedText.split('\n').filter(line => line.trim());
            const listItems = lines.map(line => `  <li>${line.trim()}</li>`).join('\n');
            const list = `<ul>\n${listItems}\n</ul>`;

            const before = value.substring(0, start);
            const after = value.substring(end);
            const newValue = before + list + after;
            onChange({ target: { value: newValue } });
        }
    };

    return (
        <div className="rich-text-editor">
            <div className="toolbar bg-gray-100 border border-gray-300 rounded-t-lg p-2 flex gap-2 flex-wrap">
                <button
                    type="button"
                    onClick={makeBold}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 font-bold text-sm"
                    title="Bold"
                >
                    B
                </button>
                <button
                    type="button"
                    onClick={makeItalic}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 italic text-sm"
                    title="Italic"
                >
                    I
                </button>
                <button
                    type="button"
                    onClick={insertLineBreak}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
                    title="Line Break"
                >
                    ↵ Break
                </button>
                <button
                    type="button"
                    onClick={insertBulletList}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
                    title="Bullet List (select text first)"
                >
                    • List
                </button>
                <div className="flex-1"></div>
                <span className="text-xs text-gray-600 self-center">HTML Editor</span>
            </div>
            <textarea
                ref={textareaRef}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={rows}
                className="w-full px-4 py-3 border border-t-0 border-gray-300 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-[#4c7085] resize-none font-mono text-sm min-h-[200px]"
                style={{ fontFamily: 'monospace' }}
            />
            <div className="mt-2 p-3 bg-gray-50 border border-gray-300 rounded-lg">
                <div className="text-xs font-semibold text-gray-600 mb-2">Preview:</div>
                <div
                    className="text-sm text-gray-700"
                    dangerouslySetInnerHTML={{ __html: value || '<span class="text-gray-600">Preview will appear here...</span>' }}
                />
            </div>
        </div>
    );
};

export default RichTextEditor;
