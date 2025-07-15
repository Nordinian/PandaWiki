import { useStore } from '@/provider';
import { Box, Divider, Stack } from "@mui/material";
import Link from 'next/link';

const Footer = ({ showBrand = true, fullWidth = false }: { showBrand?: boolean, fullWidth?: boolean }) => {
  const { kbDetail, mobile = false, catalogShow } = useStore()
  const footerSetting = kbDetail?.settings?.footer_settings
  const catalogSetting = kbDetail?.settings?.catalog_settings

  if (mobile) return <Box id='footer' sx={{
    position: 'relative',
    fontSize: '12px',
    fontWeight: 'normal',
    zIndex: 1,
    px: 3,
    color: 'text.secondary',
    ...(footerSetting?.footer_style === 'complex' && {
      borderTop: '1px solid',
      borderColor: 'divider',
    }),
  }}>
    {footerSetting?.footer_style === 'complex' && showBrand && <Box sx={{ pt: 5, pb: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Stack direction={'row'} alignItems={'center'} gap={1}>
          <Box sx={{ fontWeight: 'bold', lineHeight: '32px', fontSize: 24, color: 'text.primary' }}>{footerSetting?.brand_name}</Box>
        </Stack>
        {footerSetting?.brand_desc && <Box sx={{ fontSize: 12, color: 'text.secondary', lineHeight: '26px', mt: 2 }}>
          {footerSetting.brand_desc}
        </Box>}
      </Box>
      <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
        {footerSetting?.brand_groups?.map((group, idx) => (
          <Stack gap={1} key={group.name} sx={{
            fontSize: 14,
            lineHeight: '22px',
            width: 'calc(50% - 8px)',
            ...(idx > 1 && {
              mt: 1,
            }),
            '& a:hover': {
              color: 'primary.main',
            }
          }}>
            <Box sx={{ fontSize: 14, lineHeight: '24px', mb: 1, color: 'text.primary' }}>{group.name}</Box>
            {group.links?.map((link) => (
              <Link href={link.url} target='_blank' key={link.name} prefetch={false}>{link.name}</Link>
            ))}
          </Stack>
        ))}
      </Stack>
    </Box>}
    {!!footerSetting?.corp_name && <Box sx={{ height: 40, lineHeight: '40px', color: 'text.tertiary' }}>
      © 2025 {footerSetting?.corp_name} 版权所有
    </Box>}
    {!!footerSetting?.icp && <Box sx={{ height: 40, lineHeight: '40px', color: 'text.tertiary' }}>
      {footerSetting?.icp}
    </Box>}

  </Box>

  return <Box id='footer' sx={{
    width: `calc(100% - ${catalogShow ? catalogSetting?.catalog_width ?? 260 : 16}px)`,
    px: 10,
    ml: catalogShow ? `${catalogSetting?.catalog_width ?? 260}px` : '16px',
    position: 'relative',
    fontSize: '12px',
    zIndex: 1,
    color: 'text.secondary',
    ...(footerSetting?.footer_style === 'complex' && showBrand && {
      borderTop: '1px solid',
      borderColor: 'divider',
    }),
    ...(fullWidth && {
      maxWidth: '1200px',
      mx: 'auto',
    }),
  }}>
    {footerSetting?.footer_style === 'complex' && showBrand && <Box sx={{ py: 6 }}>
      <Stack direction={'row'} justifyContent={'space-between'} gap={10}>
        <Box sx={{ width: '30%', minWidth: 200 }}>
          {footerSetting?.brand_name && <Stack direction={'row'} alignItems={'center'} gap={1} sx={{ mb: 2 }}>
            <Box sx={{ fontWeight: 'bold', lineHeight: '32px', fontSize: 20, color: 'text.primary' }}>{footerSetting?.brand_name}</Box>
          </Stack>}
          {footerSetting?.brand_desc && <Box sx={{ fontSize: 12, lineHeight: '26px' }}>
            {footerSetting.brand_desc}
          </Box>}
        </Box>
        <Stack direction={'row'} justifyContent={'flex-end'} gap={15}>
          {footerSetting?.brand_groups?.map((group) => (
            <Stack gap={1.5} key={group.name} sx={{
              fontSize: 12,
              lineHeight: '22px',
              '& a:hover': {
                color: 'primary.main',
              }
            }}>
              <Box sx={{ fontSize: 14, lineHeight: '24px', mb: 1, color: 'text.primary' }}>{group.name}</Box>
              {group.links?.map((link) => (
                <Link href={link.url} target='_blank' key={link.name} prefetch={false}>{link.name}</Link>
              ))}
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Box>}
    <Box sx={{
      height: 40,
      lineHeight: '40px',
      textAlign: 'center',
    }}>
      <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
        <Stack direction={'row'} alignItems={'center'} gap={1} sx={{ color: 'text.tertiary' }}>
          {!!footerSetting?.corp_name && <Box>© 2025 {footerSetting?.corp_name} 版权所有</Box>}
          {!!footerSetting?.corp_name && !!footerSetting?.icp && !mobile && <Divider orientation='vertical' sx={{ mx: 0.5, height: 16 }} />}
          {!!footerSetting?.icp && <Link href={`https://beian.miit.gov.cn/`} target='_blank' prefetch={false}>{footerSetting?.icp}</Link>}
        </Stack>

      </Stack>
    </Box>
  </Box>
}

export default Footer