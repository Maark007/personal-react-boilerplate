import React from 'react';

import { render, screen } from '../../../../../testUtils';

import { ExternalLink, ExternalLinkProps } from '.';

const defaultProps: ExternalLinkProps = {
  children: 'test',
  href: '//github.com/ljosberinn',
};

describe('<ExternalLink />', () => {
  it('renders without crashing given default props', () => {
    render(<ExternalLink {...defaultProps} />);
  });

  it('has a default icon after its text', () => {
    render(<ExternalLink {...defaultProps} />);

    const link = screen.getByRole('link');
    const svg = screen.getByRole('presentation');

    expect(svg).toBeInTheDocument();
    expect(svg.parentElement).toBe(link);
  });

  it('optionally omits its default icon after its text', () => {
    const { container } = render(<ExternalLink {...defaultProps} omitIcon />);

    expect(container.querySelector('svg')).toBeNull();
  });
});
