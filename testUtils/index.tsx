import { ChakraProvider } from '@chakra-ui/core';
import type { RenderResult, RenderOptions } from '@testing-library/react';
import { render as rtlRender } from '@testing-library/react';
import type {
  RenderHookOptions,
  RenderHookResult,
} from '@testing-library/react-hooks';
import { renderHook as rtlRenderHook } from '@testing-library/react-hooks';
import type { RunOptions } from 'axe-core';
import type { ConfigData } from 'html-validate/build/config';
import { axe } from 'jest-axe';
import type { NextRouter } from 'next/router';
import { cloneElement, isValidElement } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';

import type { WithChildren } from '../src/client/Karma';
import { AuthContextProvider } from '../src/client/context/AuthContext';
import type { AuthContextDefinition } from '../src/client/context/AuthContext/AuthContext';
import { initI18Next } from '../src/client/i18n';
import { FALLBACK_LANGUAGE } from '../src/constants';
import 'html-validate/jest';
// may not be in setupTests.js because lambda-Tests rely on node-fetch which
// collides with whatwg-fetch
import 'whatwg-fetch';
import { i18nCache } from './i18n';
import { MockRouterContext } from './router';

export * from '@testing-library/react';
export { act as hookAct } from '@testing-library/react-hooks';
export { default as userEvent } from '@testing-library/user-event';

type UI = Parameters<typeof rtlRender>[0];
type Namespace = Parameters<typeof useTranslation>[0];
type I18NPropAlias = {
  i18n?: string;
  ready?: string;
  t?: string;
};

export type TestOptions = Omit<RenderOptions, 'wrapper'> & {
  /**
   * allows using `t={jest.fn()} i18n={new MockI18n()} ready={true}` in tests for components
   * that receive `t`, `i18n` and|or `ready` via props
   *
   * @example
   * ```jsx
   * // using `t` prop as is
   * render(<MyComponent t={jest.fn()} />, {
   *  i18n: {
   *    namespace: 'my-namespace'
   *  }
   * });
   *
   * // using aliases in case i18n would overwrite existing props
   * import { TFunction, i18n } from 'react-i18next';
   *
   * interface ComponentProps {
   *   translate: TFunction;
   *   i18nInstance: i18n;
   * }
   *
   * render(<Component translate={jest.fn()} />, {
   *  i18n: {
   *    namespace: 'namespace',
   *    alias: {
   *      t: 'translate',
   *      i18n: 'i18nInstance'
   *    }
   *  }
   * });
   * ```
   */
  i18n?: {
    namespace: Namespace;
    alias?: I18NPropAlias;
  };
  /**
   * optional additional wrapper, e.g. Context
   *
   * @example
   * ```ts
   * // single wrapper
   * render(<MyConponent />, {
   *  wrapper: MyContext
   * });
   *
   * // multiple wrapper
   * render(<MyConponent />, {
   *  wrapper: ({ children }) => (
   *    <ContextA>
   *      <ContextB>
   *        {children}
   *      <ContextB />
   *    <ContextA />
   *  )
   * });
   * ```
   */
  wrapper?: typeof ChildrenPassthrough;
  /**
   * optional session to initialize AuthContextProvider with
   */
  session?: AuthContextDefinition['user'];
  /**
   * optional router partial
   */
  router?: Partial<NextRouter>;
  /**
   * if `true`, wraps given ui only in `RouterContext` from next and
   * the optionally given `wrapper`
   *
   * @default false
   */
  omitKarmaProvider?: boolean;
};

// UI-less passthrough fallback to prevent using conditional logic in render
function ChildrenPassthrough({ children }: WithChildren) {
  return isValidElement(children) ? children : null;
}

export type I18nTestMiddlewareProps = WithChildren<{
  namespace: Namespace;
  alias?: I18NPropAlias;
}>;

function I18nTestMiddleware({
  children,
  namespace,
  alias = {},
}: I18nTestMiddlewareProps) {
  const { t, i18n, ready } = useTranslation(namespace);

  const props = {
    [alias.i18n ?? 'i18n']: i18n,
    [alias.ready ?? 'ready']: ready,
    [alias.t ?? 't']: t,
  };

  return isValidElement(children) ? cloneElement(children, props) : null;
}

// as singleton, else you will see lots of `act` warnings in tests which are
// technically unrelated to the tested component
const i18nInstance = initI18Next({
  i18nCache,
  language: FALLBACK_LANGUAGE,
});

type KarmaTestSetupProps = WithChildren &
  Pick<
    TestOptions,
    'i18n' | 'router' | 'omitKarmaProvider' | 'wrapper' | 'session'
  >;

function KarmaTestSetup({
  children,
  router,
  omitKarmaProvider,
  session = null,
  i18n,
  wrapper: Wrapper = ChildrenPassthrough,
}: KarmaTestSetupProps) {
  return (
    <MockRouterContext router={router}>
      {omitKarmaProvider ? (
        <Wrapper>{children}</Wrapper>
      ) : (
        <I18nextProvider i18n={i18nInstance}>
          <AuthContextProvider mode="ssr" session={session}>
            <ChakraProvider portalZIndex={40}>
              <Wrapper>
                {i18n ? (
                  <I18nTestMiddleware {...i18n}>{children}</I18nTestMiddleware>
                ) : (
                  children
                )}
              </Wrapper>
            </ChakraProvider>
          </AuthContextProvider>
        </I18nextProvider>
      )}
    </MockRouterContext>
  );
}

/**
 * Custom render for @testing-library/react
 *
 * @see https://testing-library.com/docs/react-testing-library/setup#custom-render
 * @param component the component under test
 * @param options test options
 */
export function render(
  ui: UI,
  {
    i18n,
    wrapper = ChildrenPassthrough,
    session = null,
    router,
    omitKarmaProvider,
    ...rest
  }: TestOptions = {}
): RenderResult {
  const setupProps = {
    i18n,
    omitKarmaProvider,
    router,
    session,
    wrapper,
  };

  return rtlRender(<KarmaTestSetup {...setupProps}>{ui}</KarmaTestSetup>, rest);
}

type HookTestOptions<P> = Omit<RenderHookOptions<P>, 'wrapper'> &
  Pick<
    TestOptions,
    'i18n' | 'wrapper' | 'omitKarmaProvider' | 'router' | 'session'
  >;

export function renderHook<P, R>(
  callback: (props: P) => R,
  {
    i18n,
    wrapper,
    session,
    router,
    omitKarmaProvider,
    ...rest
  }: HookTestOptions<P> = {}
): RenderHookResult<P, R> {
  const setupProps = {
    i18n,
    omitKarmaProvider,
    router,
    session,
    wrapper,
  };

  return rtlRenderHook(callback, {
    ...rest,
    wrapper: ({ children }) =>
      isValidElement(children) ? (
        <KarmaTestSetup {...setupProps}>{children}</KarmaTestSetup>
      ) : null,
  });
}

type TestA11YOptions = TestOptions & { axeOptions?: RunOptions };
/**
 * Validates against common a11y mistakes.
 *
 * Wrapper for jest-axe
 *
 * @example
 * ```jsx
 * it('passes a11y test', async () => {
 *  await testA11Y(<MyComponent />, options);
 * });
 *
 * // sometimes we need to perform interactions first to render conditional UI
 * it('passes a11y test when open', async () => {
 *  const { container } = render(<MyComponent />, options);
 *
 *  userEvent.click(screen.getByRole('button'));
 *
 *  await testA11Y(container, options);
 * });
 * ```
 *
 * @see https://github.com/nickcolley/jest-axe#testing-react-with-react-testing-library
 */
export const testA11Y = async (
  ui: UI | HTMLElement,
  { axeOptions, ...options }: TestA11YOptions = {}
): Promise<void> => {
  const element = isValidElement(ui) ? render(ui, options).container : ui;
  const results = await axe(element, axeOptions);

  expect(results).toHaveNoViolations();
};

type HTMLValidationRules =
  | 'wcag/h30'
  | 'wcag/h32'
  | 'wcga/h36'
  | 'wcag/h37'
  | 'wcag/h67'
  | 'wcag/h71'
  | 'allowed-links'
  | 'attr-case'
  | 'attr-quotes'
  | 'attribute-allowed-values'
  | 'attribute-boolean-style'
  | 'attribute-empty-style'
  | 'class-pattern'
  | 'close-attr'
  | 'close-order'
  | 'deprecated'
  | 'deprecated-rule'
  | 'doctype-html'
  | 'element-case'
  | 'element-name'
  | 'element-permitted-content'
  | 'element-permitted-occurrences'
  | 'element-permitted-order'
  | 'element-required-attributes'
  | 'element-required-content'
  | 'empty-heading'
  | 'empty-title'
  | 'heading-level'
  | 'id-pattern'
  | 'input-missing-label'
  | 'long-title'
  | 'meta-refresh'
  | 'missing-doctype'
  | 'no-autoplay'
  | 'no-conditional-comment'
  | 'no-deprecated-attr'
  | 'no-dup-attr'
  | 'no-dup-class'
  | 'no-dup-id'
  | 'no-implicit-close'
  | 'no-inline-style'
  | 'no-missing-references'
  | 'no-raw-characters'
  | 'no-redundant-role'
  | 'no-self-closing'
  | 'no-style-tag'
  | 'no-trailing-whitespace'
  | 'no-unknown-element'
  | 'prefer-button'
  | 'prefer-native-element'
  | 'prefer-tbody'
  | 'prefer-sri'
  | 'script-element'
  | 'script-type'
  | 'svg-focusable'
  | 'unrecognized-char-ref'
  | 'void'
  | 'void-content'
  | 'void-style';

// copied from node_modules/html-validate/build/config/config.data.d.ts
type RuleSeverity = 'off' | 'warn' | 'error' | number;

type Rules = {
  rules: {
    [key in HTMLValidationRules]?: RuleSeverity | [RuleSeverity];
  };
};

type HTMLValidateOptions = Omit<ConfigData, 'rules'> & Rules;

const defaultConfig: HTMLValidateOptions = {
  rules: {
    // some chakra atributes render as such
    'attribute-boolean-style': 'off',
    // emotion renders lots of inline styles
    'no-inline-style': 'off',
  },
};

type ValidateHtmlOptions = TestOptions & { htmlValidate?: HTMLValidateOptions };

/**
 * Tests against invalid HTML.
 *
 * Wrapper for html-validate/jest
 *
 * @example
 * ```jsx
 * it('contains valid html', () => {
 *   validateHtml(<MyComponent />, options);
 * })
 *
 * // sometimes we need to perform interactions first to render conditional UI
 * it('contains valid html when opened', () => {
 *  const { container } = render(<MyComponent />, options);
 *
 *  userEvent.click(screen.getByRole('button'));
 *
 *  validateHtml(container, options);
 * })
 * ```
 *
 * @see https://html-validate.org/frameworks/jest.html
 */
export const validateHtml = (
  ui: UI | HTMLElement,
  { htmlValidate, ...options }: ValidateHtmlOptions = {}
): void => {
  const merged: ConfigData = {
    ...htmlValidate,
    // @ts-expect-error required to be able to provide autocompletion
    rules: {
      ...htmlValidate?.rules,
      ...defaultConfig.rules,
    },
  };

  const element = isValidElement(ui) ? render(ui, options).container : ui;

  expect(element).toHTMLValidate(merged);
};
