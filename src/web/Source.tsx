import { useContext } from "react";
import { HighlightContext, Highlight } from "./HighlightContext";

interface Fragment {
    text: string;
    highlight: boolean;
}

const getHighlightFragments = (source: string, highlights: Highlight[]) => {
    const fragments: Fragment[] = [];
    let highlightIndex = 0;
    let fragmentStart = 0;
    let isHighlighting = false;
    for (let i = 0; i < source.length; i++) {
        if (isHighlighting) {
            if (i === highlights[highlightIndex].end) {
                isHighlighting = false;
                fragments.push({
                    highlight: true,
                    text: source.slice(fragmentStart, i),
                });
                fragmentStart = i;
                highlightIndex++;
            }
        } else {
            if (i === highlights[highlightIndex]?.start) {
                isHighlighting = true;
                fragments.push({
                    highlight: false,
                    text: source.slice(fragmentStart, i),
                });
                fragmentStart = i;
            }
        }
    }
    // Finish the last fragment
    fragments.push({
        highlight: isHighlighting,
        text: source.slice(fragmentStart),
    });
    return fragments;
};
/**
 * Renders the source code.
 */
export const Source: React.FC<{ source: string }> = ({ source }) => {
    const { highlights } = useContext(HighlightContext);
    const fragments = getHighlightFragments(source, highlights);
    return (
        <pre>
            {fragments.map(({ text, highlight }) => {
                if (highlight) {
                    return <mark>{text}</mark>;
                } else {
                    return <span>{text}</span>;
                }
            })}
        </pre>
    );
};
