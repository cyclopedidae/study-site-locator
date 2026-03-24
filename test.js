import { pipeline } from '@xenova/transformers';

const str = "6.4.3 Life: RelatednessWith respect to relatedness, two main points seem to be most important to consider within the life sphere. First, it is important that the use of a social robot contributes to a feeling of being connected to others in life, or at least does not crowd out human relationships [108]. In a negative sense, it could be the case that the use of a social robot will be at the expense of other contacts because of over-engagement with the robot. Second, if it is intended that the robot will learn a user new social skills, a transfer of such skills learned during the interaction with the robot to other domains in life is needed [13, 37]. For robot designers, it is thus important that the robot’s behavior is based on human norms and values and that the robot acts in human-like ways."

const ner = await pipeline('token-classification', 'Xenova/bert-base-NER');
const doc = await ner(str);

console.log(doc);