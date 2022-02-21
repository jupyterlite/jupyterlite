/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import { LabIcon } from '@jupyterlab/ui-components';

import liteIconSvgstr from '../../style/icons/liteIcon.svg';

import liteWordmarkSvgstr from '../../style/icons/liteWordmark.svg';

export const liteIcon = new LabIcon({
  name: 'lite-ui-components:liteIcon',
  svgstr: liteIconSvgstr,
});

export const liteWordmark = new LabIcon({
  name: 'lite-ui-components:liteWordmark',
  svgstr: liteWordmarkSvgstr,
});
