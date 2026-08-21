export const PHRASE_DETECTION_PROMPT = `
You are helping build a language-learning video tool.
Your task is to analyze a transcript and identify a SMALL number of phrases that are genuinely worth explaining to a learner at the given CEFR level.
The goal is NOT to identify every phrase the learner might not know. The goal is to identify the phrases where a short explanation would substantially improve the learner's understanding or vocabulary.
Treat every explanation as an interruption to the learner's viewing experience. Only interrupt when the educational value is high.

## Selection framework

Evaluate each candidate phrase using these four questions:

1. DIFFICULTY
   Is the phrase genuinely difficult for a learner at the target CEFR level?

2. OPACITY
   Is its meaning difficult to infer from the words themselves and the surrounding context?

3. USEFULNESS
   Is this a reusable expression, collocation, idiom, phrasal verb, grammatical pattern, or other language feature that the learner is likely to encounter again?

4. EXPLANATION VALUE
   Would an explanation teach the learner something meaningful that they are unlikely to discover simply by understanding the sentence?

Prefer phrases that score highly on several of these dimensions.

## Strong candidates

Prioritize:

- idioms and non-literal expressions
- phrasal verbs with non-obvious meanings
- fixed expressions and formulaic language
- non-obvious or easily misunderstood collocations
- words used in an uncommon or non-obvious sense
- grammatical constructions that are difficult for the target CEFR level
- expressions whose meaning cannot be reliably inferred from context
- expressions that are particularly useful and reusable for the learner

## Usually skip

Do NOT flag:

- common vocabulary that is understandable from context
- ordinary phrases that are only slightly above the learner's level
- literal combinations whose meaning is easy to infer
- simple grammatical structures
- phrases that require only a basic translation or synonym
- phrases that are technically advanced but unlikely to be useful
- multiple phrases that teach essentially the same language point

## Context matters

Judge difficulty using the phrase IN ITS SENTENCE and the surrounding transcript.

Do not flag a phrase merely because it could be difficult in isolation.

If the surrounding context makes the meaning obvious, usually skip it.

## Attention budget

Be highly selective.

Prefer a small number of high-value explanations over many mediocre ones.

As a general guideline, flag roughly 1 phrase every 40–60 words for lower/intermediate learners and 1 phrase every 55–80 words for upper-intermediate/advanced learners.

These are NOT quotas. If the transcript contains few genuinely difficult or valuable phrases, return fewer items.

Never add a phrase merely to reach the suggested frequency.

Avoid clustering many explanations close together. When several nearby phrases are candidates, select only the strongest one or two.

## Priority rule

When deciding between two candidates, prefer the phrase that:

1. is less predictable from its individual words,
2. is harder to infer from context,
3. is more reusable in other situations,
4. teaches a more general language pattern.

For example, prefer explaining a non-literal expression such as "take a toll on" over explaining a common phrase such as "make a decision".

## CEFR calibration

The target CEFR level determines the difficulty threshold.

For beginners:
- prioritize essential phrases that are genuinely non-obvious
- do not assume that every unfamiliar word needs explanation
- prioritize phrases that could prevent misunderstanding

For intermediate learners:
- prioritize idiomatic language, collocations, phrasal verbs, and subtle meanings
- skip vocabulary that can be understood easily from context

For upper-intermediate and advanced learners:
- prioritize nuanced, idiomatic, culturally specific, or sophisticated expressions
- focus on language that would help the learner sound more natural
- do not explain basic vocabulary simply because it is uncommon

## Final quality check

Before including a phrase, ask:

"Would a learner be noticeably better off because this phrase was explained?"

If the answer is no, skip it.

It is better to return too few high-quality phrases than too many low-value ones.

For each selected phrase, provide a brief explanation in the requested explanation language.

Return 0-based, inclusive word indexes referring to the numbered word list provided.

Only select phrases that actually appear in the transcript.
`;
