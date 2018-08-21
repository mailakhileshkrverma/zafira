/*******************************************************************************
 * Copyright 2013-2018 QaProSoft (http://www.qaprosoft.com).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *******************************************************************************/
package com.qaprosoft.zafira.dbaccess.dao;

import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertNotEquals;
import static org.testng.Assert.assertNull;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.testng.AbstractTestNGSpringContextTests;
import org.testng.annotations.Test;

import com.qaprosoft.zafira.dbaccess.dao.mysql.application.TestMetricMapper;
import com.qaprosoft.zafira.models.db.TestMetric;

@Test
@ContextConfiguration("classpath:com/qaprosoft/zafira/dbaccess/dbaccess-test.xml")
public class TestMetricMapperTest extends AbstractTestNGSpringContextTests
{
	private static final boolean ENABLED = false;

	private static final TestMetric TEST_METRIC = new TestMetric()
	{
		private static final long serialVersionUID = 1L;
		{
			setOperation("TEST");
			setElapsed(5000L);
			setTestId(1L);
		}
	};

	@Autowired
	private TestMetricMapper testMetricMapper;

	@Test(enabled = ENABLED)
	public void createTestMetric()
	{
		testMetricMapper.createTestMetric(TEST_METRIC);
		assertNotEquals(TEST_METRIC.getId(), 0, "TestMetric ID must be set up by autogenerated keys");
	}

	@Test(enabled = ENABLED, dependsOnMethods =
	{ "createTestMetric" })
	public void getTestMetricById()
	{
		checkTestMetric(testMetricMapper.getTestMetricById(TEST_METRIC.getId()));
	}

	private static final boolean DELETE_ENABLED = true;

	@Test(enabled = ENABLED && DELETE_ENABLED, dependsOnMethods =
	{ "createTestMetric", "getTestMetricById"})
	public void deleteTestMetricById()
	{
		testMetricMapper.deleteTestMetricById((TEST_METRIC.getId()));
		assertNull(testMetricMapper.getTestMetricById(TEST_METRIC.getId()));
	}

	private void checkTestMetric(TestMetric testMetric)
	{
		assertEquals(testMetric.getOperation(), TEST_METRIC.getOperation(), "Operation must match");
		assertEquals(testMetric.getElapsed(), TEST_METRIC.getElapsed(), "Elapsed must match");
		assertEquals(testMetric.getTestId(), TEST_METRIC.getTestId(), "Test ID must match");
	}
}
