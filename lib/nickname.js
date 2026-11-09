import { animals, colors, uniqueNamesGenerator } from 'unique-names-generator'

const SKIPPED_ANIMALS = new Set([
  'amphibian', 'anaconda', 'antlion', 'ape', 'aphid', 'asp', 'baboon', 'barnacle', 'basilisk', 'bass', 'beaver',
  'bedbug', 'boa', 'boar', 'bonobo', 'booby', 'bovid', 'bug', 'canid', 'canidae', 'cattle', 'centipede',
  'cephalopod', 'chicken', 'chimpanzee', 'cobra', 'cockroach', 'constrictor', 'cougar', 'cow', 'crow', 'cuckoo',
  'donkey', 'dove', 'earthworm', 'earwig', 'felidae', 'flea', 'fowl', 'galliform', 'gamefowl', 'gayal', 'gibbon',
  'goat', 'goose', 'gorilla', 'grasshopper', 'guineafowl', 'hippopotamus', 'hookworm', 'hornet', 'hyena', 'jackal',
  'junglefowl', 'lamprey', 'landfowl', 'leech', 'locust', 'louse', 'mammal', 'mandrill', 'marsupial', 'mite',
  'mollusk', 'monkey', 'mosquito', 'mule', 'muskox', 'orangutan', 'ox', 'peacock', 'peafowl', 'pig', 'pigeon',
  'pinniped', 'piranha', 'planarian', 'primate', 'python', 'rat', 'rattlesnake', 'reptile', 'rodent', 'rooster',
  'roundworm', 'scorpion', 'sheep', 'shrew', 'silverfish', 'skunk', 'sloth', 'slug', 'snake', 'spider', 'swallow',
  'tarantula', 'tarsier', 'termite', 'tick', 'toad', 'turkey', 'viper', 'vulture', 'wasp', 'weasel', 'wildfowl',
  'worm', 'xerinae',
])

const NAME_ANIMALS = animals.filter((word) => !SKIPPED_ANIMALS.has(word))
const NICKNAME_RE = /^[A-Za-z0-9_]{3,24}$/

export function randomNickname() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const separator = Math.random() < 0.6 ? '' : '_'
    const name = uniqueNamesGenerator({ dictionaries: [colors, NAME_ANIMALS], style: 'capital', separator, length: 2 })
    if (NICKNAME_RE.test(name)) return name
  }
  return 'Teal_Otter'
}
