import stylistic from '@stylistic/eslint-plugin'
import importPlugin from 'eslint-plugin-import'
import jsdoc from 'eslint-plugin-jsdoc'
import preferArrowFunctions from 'eslint-plugin-prefer-arrow-functions'
import unusedImports from 'eslint-plugin-unused-imports'
import { config, parser, plugin } from 'typescript-eslint'

export default config(
    {
        ignores: [
            '**/node_modules',
            '**/fixtures',
            '.rollup.cache',
            'dist',
            'coverage',
            '.yarn'
        ]
    },
    {
        languageOptions: {
            parser,
            parserOptions: {
                project: 'tsconfig.json',
                tsconfigRootDir: import.meta.dirname,
                projectService: {
                    allowDefaultProject: ['*.config.js', '*.config.cjs']
                }
            }
        },
        plugins: {
            '@import': importPlugin,
            '@jsdoc': jsdoc,
            '@prefer-arrow-functions': preferArrowFunctions,
            '@stylistic': stylistic,
            '@typescript-eslint': plugin,
            '@unused-imports': unusedImports
        }
    },
    {
        files: [
            '**/*.ts',
            '**/*.tsx',
            '**/*.js',
            '**/*.cjs',
            '**/*.cts'
        ],
        rules: {
            '@typescript-eslint/no-deprecated': 'warn',
            '@import/extensions': [
                'error',
                'ignorePackages'
            ],
            '@import/no-deprecated': 'warn',
            '@import/no-extraneous-dependencies': [
                'error',
                {
                    devDependencies: false
                }
            ],
            '@import/no-internal-modules': 'off',
            '@import/order': 'error',
            '@jsdoc/check-alignment': 'error',
            '@jsdoc/no-types': 'error',
            '@jsdoc/tag-lines': [
                'error',
                'never',
                {
                    startLines: 1
                }
            ],
            '@prefer-arrow-functions/prefer-arrow-functions': [
                'error',
                {
                    allowNamedFunctions: true,
                    classPropertiesAllowed: false,
                    disallowPrototype: true,
                    singleReturnOnly: false
                }
            ],
            '@stylistic/member-delimiter-style': [
                'error',
                {
                    multiline: {
                        delimiter: 'none',
                        requireLast: false
                    },
                    singleline: {
                        delimiter: 'comma',
                        requireLast: false
                    }
                }
            ],
            '@stylistic/quotes': [
                'error',
                'single',
                {
                    avoidEscape: true
                }
            ],
            '@stylistic/semi': [
                'error',
                'never'
            ],
            '@stylistic/type-annotation-spacing': 'error',
            '@typescript-eslint/adjacent-overload-signatures': 'error',
            '@typescript-eslint/array-type': [
                'error',
                {
                    default: 'array-simple',
                    readonly: 'generic'
                }
            ],
            '@typescript-eslint/consistent-type-assertions': 'off',
            '@typescript-eslint/consistent-type-definitions': 'error',
            '@typescript-eslint/dot-notation': 'off',
            '@typescript-eslint/explicit-member-accessibility': [
                'error',
                {
                    accessibility: 'no-public'
                }
            ],
            '@typescript-eslint/interface-name-prefix': 'off',
            '@typescript-eslint/member-ordering': [
                'error',
                {
                    default: [
                        'public-static-field',
                        'static-field',
                        'instance-field'
                    ]
                }
            ],
            '@typescript-eslint/naming-convention': [
                'error',
                {
                    custom: {
                        match: false,
                        regex: '^I[A-Z][a-z]'
                    },
                    format: [
                        'PascalCase'
                    ],
                    selector: 'interface'
                }
            ],
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-inferrable-types': 'off',
            '@typescript-eslint/no-misused-new': 'error',
            '@typescript-eslint/no-namespace': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-parameter-properties': 'off',
            '@typescript-eslint/no-redeclare': 'error',
            '@typescript-eslint/no-restricted-types': [
                'error',
                {
                    types: {
                        Boolean: {
                            message: 'Avoid using the `Boolean` type. Did you mean `boolean`?'
                        },
                        Function: {
                            message: 'Avoid using the `Function` type. Prefer a specific function type, like `() => void`.'
                        },
                        Number: {
                            message: 'Avoid using the `Number` type. Did you mean `number`?'
                        },
                        Object: {
                            message: 'Avoid using the `Object` type. Did you mean `object`?'
                        },
                        String: {
                            message: 'Avoid using the `String` type. Did you mean `string`?'
                        },
                        Symbol: {
                            message: 'Avoid using the `Symbol` type. Did you mean `symbol`?'
                        }
                    }
                }
            ],
            '@typescript-eslint/no-shadow': [
                'error',
                {
                    hoist: 'all'
                }
            ],
            '@typescript-eslint/no-this-alias': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-use-before-define': 'off',
            '@typescript-eslint/no-require-imports': 'error',
            '@typescript-eslint/prefer-for-of': 'error',
            '@typescript-eslint/prefer-function-type': 'error',
            '@typescript-eslint/prefer-namespace-keyword': 'error',
            '@typescript-eslint/triple-slash-reference': [
                'error',
                {
                    lib: 'always',
                    path: 'always',
                    types: 'prefer-import'
                }
            ],
            '@typescript-eslint/unified-signatures': 'error',
            '@unused-imports/no-unused-imports': 'error',
            '@unused-imports/no-unused-vars': [
                'error',
                {
                    args: 'after-used',
                    argsIgnorePattern: '^_',
                    caughtErrors: 'all',
                    caughtErrorsIgnorePattern: '^_',
                    ignoreRestSiblings: true,
                    vars: 'all',
                    varsIgnorePattern: '^_'
                }
            ],
            'arrow-body-style': 'error',
            '@stylistic/arrow-parens': 'off',
            '@stylistic/brace-style': [
                'error',
                '1tbs'
            ],
            '@stylistic/comma-dangle': 'error',
            'complexity': 'off',
            'constructor-super': 'error',
            'curly': 'off',
            '@stylistic/eol-last': 'error',
            'eqeqeq': [
                'off',
                'always'
            ],
            'guard-for-in': 'off',
            '@stylistic/id-blacklist': 'off',
            'id-match': 'off',
            '@stylistic/linebreak-style': 'off',
            'max-classes-per-file': 'off',
            '@stylistic/max-len': 'off',
            '@stylistic/new-parens': 'error',
            'no-bitwise': 'off',
            'no-caller': 'error',
            'no-cond-assign': 'error',
            'no-console': 'off',
            'no-debugger': 'error',
            'no-duplicate-case': 'error',
            'no-duplicate-imports': 'error',
            'no-empty': 'off',
            'no-eval': 'error',
            'no-extra-bind': 'error',
            'no-fallthrough': 'off',
            'no-invalid-this': 'off',
            '@stylistic/no-multiple-empty-lines': [
                'error',
                {
                    max: 1,
                    maxBOF: 0
                }
            ],
            'no-new-func': 'error',
            'no-new-wrappers': 'error',
            'no-redeclare': 'off',
            'no-restricted-imports': [
                'error',
                {
                    message: "Please import directly from 'rxjs' instead",
                    name: 'rxjs/Rx'
                }
            ],
            'no-return-await': 'error',
            'no-sequences': 'error',
            'no-sparse-arrays': 'error',
            'no-template-curly-in-string': 'error',
            'no-throw-literal': 'error',
            '@stylistic/no-trailing-spaces': 'error',
            'no-undef-init': 'error',
            'no-underscore-dangle': 'off',
            'no-unsafe-finally': 'error',
            'no-unused-labels': 'off',
            'no-unused-vars': 'off',
            'no-var': 'error',
            'object-shorthand': 'error',
            'one-var': [
                'error',
                'never'
            ],
            'prefer-const': 'error',
            'prefer-object-spread': 'error',
            '@stylistic/quote-props': [
                'error',
                'consistent-as-needed'
            ],
            '@stylistic/quotes': 'off',
            'radix': 'error',
            'sort-keys': 'off',
            '@stylistic/space-before-function-paren': [
                'error',
                {
                    anonymous: 'always',
                    asyncArrow: 'always',
                    named: 'never'
                }
            ],
            '@stylistic/space-in-parens': [
                'error',
                'never'
            ],
            'use-isnan': 'error',
            'valid-typeof': 'off'
        }
    },
    {
        files: [
            '*.config.js',
            '*.config.cjs',
            '*.config.ts',
            '*.config.cts',
            'test/**/*.js'
        ],
        rules: {
            '@import/no-extraneous-dependencies': [
                'off',
                {
                    devDependencies: false
                }
            ],
            '@typescript-eslint/no-require-imports': 'off'
        }
    }
)
