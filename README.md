# is-mdm

is-mdm is a tiny library inspired by LGUG2Z's [article](https://lgug2z.com/articles/normalize-identifying-corporate-devices-in-your-software/) on detecting MDM. While the article uses rust, I wanted to do the same thing in JavaScript quickly and as a zero dependency module.

## Usage

```js
const isMdm = require('is-mdm')

isMdm() // will return true if we think the device is managed by MDM, otherwise will return false
```

## Supported Platforms

Currently, is-mdm supports both macOS and Windows. We use Node.js's `process.platform` to determine which platform-specific command to run to collect MDM output.

If you'd like to add support for AIX, Darwin, FreeBSD, Linux, OpenBSD, or SunOS, PRs are welcome.

## API

### isMdm()

Returns a boolean indicating whether or not the current device is managed by MDM.

Under the hood, `isMdm()` runs `isMdmMacOS()` or `isMdmWindows()`, depending on the platform detected with `process.platform`.

## Acknowledgements

- Thanks to LGUG2Z for their [article](https://lgug2z.com/articles/normalize-identifying-corporate-devices-in-your-software/) that inspired this package.
- Thanks to [is-odd](https://npm.im/is-odd) for being such a weird package and the namesake and API inspriation for this package.