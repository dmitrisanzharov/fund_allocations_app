import { SxProps, Theme } from '@mui/material';

export const outlinedButtonSx: SxProps<Theme> = {
    color: 'black',
    borderColor: 'black',
    '&:hover': {
        borderColor: 'black',
        backgroundColor: 'lightgray',
        color: 'black'
    }
};
