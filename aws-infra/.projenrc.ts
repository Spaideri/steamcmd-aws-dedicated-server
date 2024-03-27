import { awscdk } from 'projen';
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.1.0',
  defaultReleaseBranch: 'main',
  name: 'steamcmd-aws-dedicated-server',
  projenrcTs: true,

  deps: [
    'yaml@>=2.4.1',
    'zod@>=3.22.4',
  ],
  gitignore: [
    '.idea',
    '*.iml',
  ],
  buildWorkflow: false,
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();