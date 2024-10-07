import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Text } from '@react-three/drei';
import { motion } from 'framer-motion';
import { ChakraProvider, Box, VStack, Heading, Input, Select, Button, Text as ChakraText, useToast } from '@chakra-ui/react';
import axios from 'axios';

const jobPositions = [
  "software engineer intern",
  "senior software engineer",
  "tech lead",
  "devops engineer",
  "ml engineer",
  "devops intern",
  "associate software engineer"
];

function RotatingWords({ words }) {
  const wordsRef = useRef([]);

  useFrame(({ clock }) => {
    wordsRef.current.forEach((word, i) => {
      if (word) {
        word.position.x = 2 * Math.cos(clock.getElapsedTime() * 0.5 + i * (Math.PI * 2 / words.length));
        word.position.y = 2 * Math.sin(clock.getElapsedTime() * 0.5 + i * (Math.PI * 2 / words.length));
        word.position.z = Math.sin(clock.getElapsedTime() * 0.5 + i * (Math.PI * 2 / words.length));
      }
    });
  });

  return words.map((word, index) => (
    <Text
      key={word}
      ref={(el) => (wordsRef.current[index] = el)}
      fontSize={0.5}
      color="white"
    >
      {word}
    </Text>
  ));
}

function App() {
  const [file, setFile] = useState(null);
  const [jobPosition, setJobPosition] = useState('');
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const toast = useToast();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleJobPositionChange = (e) => {
    setJobPosition(e.target.value);
  };

  const handleAnalyze = async () => {
    if (!file || !jobPosition) {
      toast({
        title: "Error",
        description: "Please upload a resume and select a job position.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('job_position', jobPosition);

    try {
      const response = await axios.post('http://localhost:8001/api/analyze-resume/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data);
    } catch (err) {
      console.error('Error analyzing resume:', err.response ? err.response.data : err.message);
      toast({
        title: "Error",
        description: "Error analyzing resume. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <ChakraProvider>
      <Box minHeight="100vh" bg="gray.900" color="white" p={8}>
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="2xl" textAlign="center" bgGradient="linear(to-r, cyan.400, blue.500, purple.600)" bgClip="text">
            TalentSphere Resume Analyzer
          </Heading>
          <Box height="50vh" position="relative">
            <Canvas>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              <Sphere args={[1, 64, 64]}>
                <meshStandardMaterial color="#4299E1" wireframe />
              </Sphere>
              {result && <RotatingWords words={result.skills} />}
              <OrbitControls enableZoom={false} enablePan={false} />
            </Canvas>
          </Box>
          <VStack spacing={4}>
            <Input type="file" onChange={handleFileChange} accept=".pdf,.docx" />
            <Select placeholder="Select Job Position" value={jobPosition} onChange={handleJobPositionChange}>
              {jobPositions.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </Select>
            <Button colorScheme="blue" onClick={handleAnalyze} isLoading={isAnalyzing}>
              Analyze Resume
            </Button>
          </VStack>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Box bg="whiteAlpha.200" p={6} borderRadius="md">
                <Heading size="lg" mb={4}>Analysis Result</Heading>
                <ChakraText>Job Position: {result.job_position}</ChakraText>
                <ChakraText>
                  Passes: {result.passes ? 'Yes' : 'No'} (Pass mark: confidence >= {result.pass_mark * 100}%)
                </ChakraText>
                <ChakraText>Confidence: {(result.confidence * 100).toFixed(2)}%</ChakraText>
                <ChakraText>Skills found in CV: {result.skills.join(', ')}</ChakraText>
              </Box>
            </motion.div>
          )}
        </VStack>
      </Box>
    </ChakraProvider>
  );
}

export default App;