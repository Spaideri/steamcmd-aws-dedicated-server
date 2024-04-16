import fs from 'fs'

export const listServerNames = (): string[] => {
  return fs.readdirSync(`${__dirname}/../../servers`)
    .filter(fileName => !fileName.includes('.'))
};