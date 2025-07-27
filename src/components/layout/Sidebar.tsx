import { Box, VStack, Icon, Tooltip, useDisclosure } from '@chakra-ui/react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiHome, FiSearch, FiBookmark, FiSettings } from 'react-icons/fi'

const MotionBox = motion(Box)

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const navItems = [
    { icon: FiHome, path: '/', label: 'Home' },
    { icon: FiSearch, path: '/search', label: 'Search' },
    { icon: FiBookmark, path: '/library', label: 'Library' },
    { icon: FiSettings, path: '/settings', label: 'Settings' },
  ]

  return (
    <MotionBox
      as="nav"
      bg="background.secondary"
      w={isOpen ? '200px' : '60px'}
      h="100vh"
      transition="width 0.2s"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      position="relative"
      zIndex="docked"
    >
      <VStack spacing={6} pt={8} align="center">
        {navItems.map((item) => (
          <Tooltip
            key={item.path}
            label={item.label}
            placement="right"
            isDisabled={isOpen}
          >
            <Box
              as="button"
              onClick={() => navigate(item.path)}
              p={3}
              borderRadius="md"
              w={isOpen ? '80%' : '40px'}
              bg={location.pathname === item.path ? 'whiteAlpha.100' : 'transparent'}
              color={location.pathname === item.path ? 'brand.primary' : 'whiteAlpha.900'}
              _hover={{
                bg: 'whiteAlpha.200',
                color: 'brand.primary',
              }}
              transition="all 0.2s"
              display="flex"
              alignItems="center"
              justifyContent={isOpen ? 'flex-start' : 'center'}
            >
              <Icon
                as={item.icon}
                boxSize={5}
                mr={isOpen ? 3 : 0}
              />
              {isOpen && (
                <MotionBox
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  fontSize="sm"
                  fontWeight="medium"
                >
                  {item.label}
                </MotionBox>
              )}
            </Box>
          </Tooltip>
        ))}
      </VStack>
    </MotionBox>
  )
}

export default Sidebar