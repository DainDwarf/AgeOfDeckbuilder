# Glossary

The **closed vocabulary** of gameplay. Every concept has exactly one term, and that term is the
only one used for it — on cards, in the UI, in the codex, in code identifiers, in these docs.
Paraphrase and synonyms are defects: *remove* is never *destroy*, *sacrifice* or *trash* if
*remove* is the term. A concept that has no term here has no term yet; adding one is a design
decision made with the user, not a choice an implementer makes in passing.

Each row lists the forbidden near-synonyms so the review and the lint hook can catch them.
Prose that must mention a forbidden word for another reason (a card *named* "Sacrifice") is a
deliberate exception the reviewer sees; there is no silent allow-list.

| Term | Meaning | Not |
|------|---------|-----|

*(empty — terms are added as the game is designed)*
