import { Box, VStack, Icon, Tooltip } from '@chakra-ui/react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiHome, FiSearch, FiBookmark, FiSettings } from 'react-icons/fi'

const MotionBox = motion(Box)

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { icon: FiHome, path: '/', label: 'Home' },
    { icon: FiSearch, path: '/search', label: 'Search' },
    { icon: FiBookmark, path: '/library', label: 'Library' },
    { icon: FiSettings, path: '/settings', label: 'Settings' },
  ]

  return (
    <MotionBox
      as="nav"
      w="60px"
      h="auto"
      position="fixed"
      left={4}
      top="50%"
      transform="translateY(-50%)"
      zIndex="docked"
    >
      <VStack spacing={4} align="center">
        {navItems.map((item) => (
          <Tooltip
            key={item.path}
            label={item.label}
            placement="right"
          >
            <Box
              as="button"
              onClick={() => navigate(item.path)}
              p={3}
              borderRadius="full"
              w="48px"
              h="48px"
              bg={location.pathname === item.path ? 'whiteAlpha.200' : 'transparent'}
              color={location.pathname === item.path ? 'green.400' : 'whiteAlpha.700'}
              _hover={{
                bg: 'whiteAlpha.100',
                color: 'green.400',
              }}
              transition="all 0.2s"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon
                as={item.icon}
                boxSize={6}
              />
            </Box>
          </Tooltip>
        ))}
      </VStack>
    </MotionBox>
  )
}

export default Sidebar