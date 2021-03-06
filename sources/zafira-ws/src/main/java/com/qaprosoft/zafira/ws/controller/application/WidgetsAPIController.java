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
package com.qaprosoft.zafira.ws.controller.application;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.validation.Valid;

import org.apache.commons.lang.exception.ExceptionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.util.CollectionUtils;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;

import com.qaprosoft.zafira.dbaccess.utils.SQLAdapter;
import com.qaprosoft.zafira.models.db.Attribute;
import com.qaprosoft.zafira.models.db.Widget;
import com.qaprosoft.zafira.services.exceptions.ServiceException;
import com.qaprosoft.zafira.services.services.application.SettingsService;
import com.qaprosoft.zafira.services.services.application.WidgetService;
import com.qaprosoft.zafira.services.util.URLResolver;
import com.qaprosoft.zafira.ws.controller.AbstractController;
import com.qaprosoft.zafira.ws.swagger.annotations.ResponseStatusDetails;

import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import springfox.documentation.annotations.ApiIgnore;

@Controller
@ApiIgnore
@RequestMapping("api/widgets")
public class WidgetsAPIController extends AbstractController
{
	@Autowired
	private URLResolver urlResolver;

	@Autowired
	private WidgetService widgetService;

	@Autowired
	private SettingsService settingsService;

	@ResponseStatusDetails
	@ApiOperation(value = "Create widget", nickname = "createWidget", httpMethod = "POST", response = Widget.class)
	@ResponseStatus(HttpStatus.OK)
	@ApiImplicitParams(
	{ @ApiImplicitParam(name = "Authorization", paramType = "header") })
	@PreAuthorize("hasPermission('MODIFY_WIDGETS')")
	@RequestMapping(method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
	public @ResponseBody Widget createWidget(@RequestBody @Valid Widget widget,
			@RequestHeader(value = "Project", required = false) String project) throws ServiceException
	{
		return widgetService.createWidget(widget);
	}

	@ResponseStatusDetails
	@ApiOperation(value = "Get widget", nickname = "getWidget", httpMethod = "GET", response = Widget.class)
	@ResponseStatus(HttpStatus.OK)
	@ApiImplicitParams(
	{ @ApiImplicitParam(name = "Authorization", paramType = "header") })
	@RequestMapping(value = "{id}", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
	public @ResponseBody Widget getWidget(@PathVariable(value = "id") long id) throws ServiceException
	{
		return widgetService.getWidgetById(id);
	}

	@ResponseStatusDetails
	@ApiOperation(value = "Delete widget", nickname = "deleteWidget", httpMethod = "DELETE")
	@ResponseStatus(HttpStatus.OK)
	@ApiImplicitParams(
	{ @ApiImplicitParam(name = "Authorization", paramType = "header") })
	@PreAuthorize("hasPermission('MODIFY_WIDGETS')")
	@RequestMapping(value = "{id}", method = RequestMethod.DELETE)
	public void deleteWidget(@PathVariable(value = "id") long id) throws ServiceException
	{
		widgetService.deleteWidgetById(id);
	}

	@ResponseStatusDetails
	@ApiOperation(value = "Update widget", nickname = "updateWidget", httpMethod = "PUT", response = Widget.class)
	@ResponseStatus(HttpStatus.OK)
	@ApiImplicitParams(
	{ @ApiImplicitParam(name = "Authorization", paramType = "header") })
	@PreAuthorize("hasPermission('MODIFY_WIDGETS')")
	@RequestMapping(method = RequestMethod.PUT, produces = MediaType.APPLICATION_JSON_VALUE)
	public @ResponseBody Widget updateWidget(@RequestBody Widget widget) throws ServiceException
	{
		return widgetService.updateWidget(widget);
	}

	@ResponseStatusDetails
	@ApiOperation(value = "Execute SQL", nickname = "executeSQL", httpMethod = "POST", response = List.class)
	@ResponseStatus(HttpStatus.OK)
	@ApiImplicitParams(
	{ @ApiImplicitParam(name = "Authorization", paramType = "header") })
	@RequestMapping(value = "sql", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
	public @ResponseBody List<Map<String, Object>> executeSQL(@RequestBody @Valid SQLAdapter sql,
			@RequestParam(value = "projects", defaultValue = "", required = false) List<String> projects,
			@RequestParam(value = "currentUserId", required = false) String currentUserId,
			@RequestParam(value = "dashboardName", required = false) String dashboardName,
            @RequestParam(value = "stackTraceRequired", required = false) boolean stackTraceRequired ) throws ServiceException
	{
		String query = sql.getSql();
		List<Map<String, Object>> resultList;
		try {
		if (sql.getAttributes() != null)
		{
			for (Attribute attribute : sql.getAttributes())
			{
				query = query.replaceAll("#\\{" + attribute.getKey() + "\\}", attribute.getValue());
			}
		}

			query = query
				.replaceAll("#\\{project}", formatProjects(projects))
				.replaceAll("#\\{dashboardName}", !StringUtils.isEmpty(dashboardName) ? dashboardName : "")
				.replaceAll("#\\{currentUserId}", !StringUtils.isEmpty(currentUserId) ? currentUserId : String.valueOf(getPrincipalId()))
				.replaceAll("#\\{currentUserName}", String.valueOf(getPrincipalName()))
				.replaceAll("#\\{zafiraURL}", urlResolver.buildWebURL())
				.replaceAll("#\\{jenkinsURL}", settingsService.getSettingByName("JENKINS_URL").getValue())
				.replaceAll("#\\{hashcode}", "0")
				.replaceAll("#\\{testCaseId}", "0");
			
            resultList = widgetService.executeSQL(query);
        }
        catch (Exception e) {
            if (stackTraceRequired) {
                resultList = new ArrayList<>();
                Map<String, Object> exceptionMap = new HashMap<>();
                exceptionMap.put("Check your query", ExceptionUtils.getFullStackTrace(e));
                resultList.add(exceptionMap);
                return resultList;
            }
            else {
                throw e;
            }
        }
        return resultList;
    }
	
	private String formatProjects(List<String> projects)
	{
		String result = "%";
		if(!CollectionUtils.isEmpty(projects))
		{
			StringBuilder sb = new StringBuilder();
			for(String project : projects)
			{
				sb.append(project).append(",");
			}
			result = StringUtils.removeEnd(sb.toString(), ",");
		}
		return result;
	}

	@ResponseStatusDetails
	@ApiOperation(value = "Get all widgets", nickname = "getAllWidgets", httpMethod = "GET", response = List.class)
	@ResponseStatus(HttpStatus.OK)
	@ApiImplicitParams(
	{ @ApiImplicitParam(name = "Authorization", paramType = "header") })
	@RequestMapping(method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
	public @ResponseBody List<Widget> getAllWidgets() throws ServiceException
	{
		return widgetService.getAllWidgets();
	}
}
