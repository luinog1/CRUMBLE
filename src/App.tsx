import { Box, Flex } from '@chakra-ui/react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from '@components/layout/Sidebar'
import Home from '@pages/Home'
import Search from '@pages/Search'
import Library from '@pages/Library'
import Settings from '@pages/Settings'
import Details from '@pages/Details'
import Player from '@components/media/Player'

const App = () => {
  return (
    <Flex h="100vh" bg="background.primary">
      <Sidebar />
      <Box flex="1" overflow="auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/library" element={<Library />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/details/:type/:id" element={<Details />} />
        </Routes>
      </Box>
      <Player />
    </Flex>
  )
}

export default App