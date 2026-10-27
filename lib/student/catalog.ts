export const levels = ['Beginner', 'Elementary', 'Intermediate', 'Upper Intermediate', 'Advanced'] as const;
export const goals = ['IELTS Preparation', 'Spoken English', 'Grammar Improvement', 'General English'] as const;
export const categories = [
    { slug: 'grammar', name: 'Grammar Practice', description: 'Build a stronger foundation in English grammar.', topics: ['Tenses', 'Articles', 'Prepositions', 'Modal Verbs', 'Conditionals', 'Passive Voice', 'Subject-Verb Agreement', 'Sentence Structure'] },
    { slug: 'sentence-completion', name: 'Sentence Completion', description: 'Practise structure, accuracy and natural sentences.', topics: ['Fill in the Blanks', 'Sentence Completion', 'Sentence Transformation', 'Word Order', 'Error Correction'] },
    { slug: 'vocabulary', name: 'Vocabulary Practice', description: 'Develop the words and expressions you need.', topics: ['Synonyms and Antonyms', 'Word Formation', 'Collocations', 'Academic Vocabulary', 'Phrasal Verbs'] },
    { slug: 'reading', name: 'Reading Practice', description: 'Develop comprehension and reading strategies.', topics: ['Reading Comprehension', 'True/False/Not Given', 'Matching Headings', 'Multiple Choice', 'Summary Completion'] },
    { slug: 'listening', name: 'Listening Practice', description: 'Build listening comprehension and attention to detail.', topics: ['Listening Comprehension', 'Multiple Choice', 'Note Completion', 'Form Completion'] },
    { slug: 'writing', name: 'Writing Practice', description: 'Develop clear sentences, paragraphs and IELTS responses.', topics: ['Sentence Writing', 'Paragraph Writing', 'IELTS Writing Task 1', 'IELTS Writing Task 2'] },
    { slug: 'speaking', name: 'Speaking Practice', description: 'Prepare to express your ideas with confidence.', topics: ['Speaking Part 1', 'Speaking Part 2', 'Speaking Part 3', 'General Speaking Topics'] }
] as const;
export const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const categoryBySlug = (slug: string) => categories.find(c => c.slug === slug);
