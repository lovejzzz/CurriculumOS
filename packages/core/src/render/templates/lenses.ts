/** render/templates/lenses.ts — per-discipline lens data (DATA, ADR-10 exempt).
 *  Templates are data, not code (030-ports kill list): the 18k-line compiler's
 *  knowledge becomes versioned data modules consumed by a small render engine. */
import type { DisciplineLens } from '../../schema/courseObject.ts';

export interface Lens {
  /** human label for the discipline line on the syllabus header */
  label: string;
  /** what the practice/lab activity is typically called */
  activity: string;
  /** noun for the core deliverable students produce */
  deliverable: string;
  /** verbs that signal the discipline's habits of mind */
  signatureVerbs: string[];
}

export const LENSES: Record<DisciplineLens, Lens> = {
  'stem-quant': {
    label: 'Quantitative STEM',
    activity: 'problem set',
    deliverable: 'solution write-up',
    signatureVerbs: ['derive', 'compute', 'prove', 'estimate'],
  },
  'stem-lab': {
    label: 'Laboratory science',
    activity: 'lab',
    deliverable: 'lab report',
    signatureVerbs: ['observe', 'identify', 'measure', 'classify'],
  },
  cs: {
    label: 'Computer science',
    activity: 'coding lab',
    deliverable: 'program',
    signatureVerbs: ['implement', 'debug', 'trace', 'test'],
  },
  humanities: {
    label: 'Humanities',
    activity: 'close reading',
    deliverable: 'essay',
    signatureVerbs: ['interpret', 'argue', 'contextualize', 'compare'],
  },
  'social-science': {
    label: 'Social science',
    activity: 'problem set',
    deliverable: 'analysis',
    signatureVerbs: ['model', 'explain', 'evaluate', 'predict'],
  },
  language: {
    label: 'Language',
    activity: 'speaking practice',
    deliverable: 'oral performance',
    signatureVerbs: ['produce', 'comprehend', 'pronounce', 'converse'],
  },
  arts: {
    label: 'Arts',
    activity: 'studio',
    deliverable: 'portfolio piece',
    signatureVerbs: ['create', 'critique', 'compose', 'perform'],
  },
  business: {
    label: 'Business',
    activity: 'case discussion',
    deliverable: 'case analysis',
    signatureVerbs: ['analyze', 'recommend', 'justify', 'assess'],
  },
  health: {
    label: 'Health science',
    activity: 'clinical case study',
    deliverable: 'case write-up',
    signatureVerbs: ['assess', 'explain', 'apply', 'evaluate'],
  },
  education: {
    label: 'Education',
    activity: 'practicum',
    deliverable: 'lesson plan',
    signatureVerbs: ['design', 'reflect', 'adapt', 'evaluate'],
  },
  general: {
    label: 'General',
    activity: 'activity',
    deliverable: 'assignment',
    signatureVerbs: ['explain', 'apply', 'analyze', 'create'],
  },
};
