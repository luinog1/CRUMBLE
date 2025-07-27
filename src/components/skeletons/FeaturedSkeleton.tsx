import { Box, Skeleton, Stack } from '@chakra-ui/react'
import { motion } from 'framer-motion'

const MotionBox = motion(Box)

const FeaturedSkeleton = () => {
  return (
    <MotionBox
      position="relative"
      height="70vh"
      borderRadius="xl"
      overflow="hidden"
      bg="gray.900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Skeleton
        height="100%"
        startColor="gray.800"
        endColor="gray.700"
      />

      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        p={8}
      >
        <Stack spacing={4} maxW="2xl">
          <Skeleton height="48px" width="60%" />
          <Skeleton height="24px" width="80%" />
          <Stack direction="row" spacing={4} pt={2}>
            <Skeleton height="48px" width="120px" />
            <Skeleton height="48px" width="140px" />
          </Stack>
        </Stack>
      </Box>
    </MotionBox>
  )
}

export default FeaturedSkeleton